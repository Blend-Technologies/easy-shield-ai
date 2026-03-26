// @ts-nocheck — Deno edge function: VS Code TS checker doesn't understand Deno globals.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type RFPDocument = { name: string; content: string };
type PreExtractedItem = { type: string; text: string; supportingText: string; documentName: string };

// ── JSON repair & extraction ──────────────────────────────────────────────────
function repairJSON(raw: string): string {
  let out = "", inStr = false, escaped = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (escaped) { out += ch; escaped = false; continue; }
    if (ch === "\\" && inStr) { out += ch; escaped = true; continue; }
    if (ch === '"') { inStr = !inStr; out += ch; continue; }
    if (inStr) {
      const code = ch.charCodeAt(0);
      if (ch === "\n") { out += "\\n"; continue; }
      if (ch === "\r") { out += "\\r"; continue; }
      if (ch === "\t") { out += "\\t"; continue; }
      if (code < 0x20) { out += "\\u" + code.toString(16).padStart(4, "0"); continue; }
    }
    out += ch;
  }
  return out;
}

function extractJSON(text: string): any {
  const slice = (s: string) => {
    const start = s.indexOf("{"); const end = s.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("no braces");
    return s.slice(start, end + 1);
  };
  const attempts: Array<() => any> = [
    () => JSON.parse(text.trim()),
    () => { const m = text.match(/```(?:json)?\s*([\s\S]*?)```/); if (!m) throw new Error("no fence"); return JSON.parse(m[1].trim()); },
    () => JSON.parse(slice(text)),
    () => JSON.parse(slice(repairJSON(text))),
    () => { const m = text.match(/```(?:json)?\s*([\s\S]*?)```/); if (!m) throw new Error("no fence"); return JSON.parse(repairJSON(m[1].trim())); },
  ];
  for (const attempt of attempts) { try { return attempt(); } catch { /* try next */ } }
  console.error("extractJSON failed. First 500 chars:", text.slice(0, 500));
  throw new Error("Failed to parse JSON from AI response");
}

const MAX_DOC_CHARS = 10_000;
const truncateDoc = (content: string) =>
  content.length <= MAX_DOC_CHARS ? content : content.slice(0, MAX_DOC_CHARS) + "\n\n[... truncated ...]";

// Remove lone Unicode surrogates that break JSON serialization.
// Walks char-by-char so pair tracking is exact (regex replacer offsets shift).
function sanitize(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0xD800 && code <= 0xDBFF) {          // potential high surrogate
      const next = text.charCodeAt(i + 1);
      if (next >= 0xDC00 && next <= 0xDFFF) {         // valid pair — keep both
        out += text[i] + text[i + 1];
        i++;
      }
      // else lone high surrogate — drop
    } else if (code >= 0xDC00 && code <= 0xDFFF) {    // lone low surrogate — drop
      // skip
    } else {
      out += text[i];
    }
  }
  return out;
}

// Also strip JSON-escaped lone surrogates from a serialized JSON string.
// Catches any that slipped through before stringify (e.g. inside nested objects).
function sanitizeJson(json: string): string {
  // Remove \uD800-\uDBFF NOT followed by \uDC00-\uDFFF  (lone high)
  // Remove \uDC00-\uDFFF NOT preceded by \uD800-\uDBFF  (lone low)
  return json
    .replace(/\\u[dD][89aAbB][0-9a-fA-F]{2}(?!\\u[dD][cCdDeEfF][0-9a-fA-F]{2})/g, "")
    .replace(/(?<!\\u[dD][89aAbB][0-9a-fA-F]{2})\\u[dD][cCdDeEfF][0-9a-fA-F]{2}/g, "");
}

// ── pgvector retrieval ────────────────────────────────────────────────────────
async function generateEmbeddingAzure(
  text: string, endpoint: string, apiKey: string, deployment: string, apiVersion: string,
): Promise<number[]> {
  const url = `${endpoint}/openai/deployments/${deployment}/embeddings?api-version=${apiVersion}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ input: text.slice(0, 8000) }),
  });
  if (!resp.ok) throw new Error(`Azure embedding error (${resp.status})`);
  const data = await resp.json();
  return data.data[0].embedding as number[];
}

async function queryRelevantChunks(
  query: string, sessionId: string, pgUrl: string,
  azureEndpoint: string, azureApiKey: string, embeddingDeployment: string, apiVersion: string,
  topK = 6,
): Promise<string> {
  if (!sessionId || !pgUrl || !azureEndpoint || !azureApiKey) return "";
  const client = new Client(pgUrl);
  await client.connect();
  try {
    const embedding = await generateEmbeddingAzure(query, azureEndpoint, azureApiKey, embeddingDeployment, apiVersion);
    const embeddingStr = `[${embedding.join(",")}]`;
    const result = await client.queryObject<{ content: string; document_name: string }>(
      `SELECT content, document_name FROM document_chunks
       WHERE session_id = $1 ORDER BY embedding <=> $2::vector LIMIT $3`,
      [sessionId, embeddingStr, topK],
    );
    if (result.rows.length === 0) return "";
    return (
      "\n--- Retrieved capability context ---\n" +
      result.rows.map((r) => `[${r.document_name}]:\n${r.content}`).join("\n\n---\n\n") +
      "\n--- End of retrieved context ---\n"
    );
  } catch (e) {
    console.warn("pgvector query failed:", e);
    return "";
  } finally {
    await client.end();
  }
}

async function queryKnowledgeBaseChunks(
  query: string, supabaseDbUrl: string,
  azureEndpoint: string, azureApiKey: string, embeddingDeployment: string, apiVersion: string,
  topK = 5,
): Promise<string> {
  if (!supabaseDbUrl || !azureEndpoint || !azureApiKey) return "";
  const client = new Client(supabaseDbUrl);
  await client.connect();
  try {

    const embedding = await generateEmbeddingAzure(query, azureEndpoint, azureApiKey, embeddingDeployment, apiVersion);
    const embeddingStr = `[${embedding.join(",")}]`;
    const result = await client.queryObject<{ content: string; document_name: string; category: string }>(
      `SELECT content, document_name, category FROM knowledge_base_chunks
       ORDER BY embedding <=> $1::vector LIMIT $2`,
      [embeddingStr, topK],
    );
    if (result.rows.length === 0) return "";
    return (
      "\n--- Style & Reference Templates (permanent knowledge base) ---\n" +
      result.rows.map((r) => `[${r.document_name} | ${r.category}]:\n${r.content}`).join("\n\n---\n\n") +
      "\n--- End of style templates ---\n"
    );
  } catch (e) {
    console.warn("knowledge_base_chunks query failed:", e);
    return "";
  } finally {
    await client.end();
  }
}

// ── Claude helper (non-streaming) ────────────────────────────────────────────
async function callClaude(
  apiKey: string, model: string,
  messages: { role: string; content: string }[],
  step = "unknown", maxRetries = 2, maxTokens = 8192,
): Promise<string> {
  const systemMsg = messages.find((m) => m.role === "system");
  const chatMessages = messages.filter((m) => m.role !== "system");
  const sanitizedMessages = chatMessages.map((m) => ({ ...m, content: sanitize(m.content) }));
  const body: Record<string, unknown> = { model, max_tokens: maxTokens, messages: sanitizedMessages };
  if (systemMsg) body.system = sanitize(systemMsg.content);
  const bodyStr = sanitizeJson(JSON.stringify(body));
  let lastStatus = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = lastStatus === 529 ? 15_000 * attempt : 3_000 * attempt;
      await new Promise((r) => setTimeout(r, delay));
    }
    let response: Response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: bodyStr,
      });
    } catch (e) {
      if (attempt < maxRetries) continue;
      throw new Error(`[${step}] Network error: ${e}`);
    }
    if (response.ok) {
      const data = await response.json();
      return data.content?.[0]?.text ?? "";
    }
    lastStatus = response.status;
    const errBody = await response.text();
    console.error(`[${step}] Claude ${response.status}:`, errBody.slice(0, 300));
    if (response.status >= 500 && attempt < maxRetries) continue;
    if (response.status === 429) throw new Error(`[${step}] Rate limit. Please retry.`);
    throw new Error(`[${step}] Claude error (${response.status}): ${errBody.slice(0, 200)}`);
  }
  throw new Error(`[${step}] Failed after ${maxRetries + 1} attempts`);
}

// ── Step 1: Section-assign extracted requirements ─────────────────────────────
async function executeExtractRequirements(
  preExtractedItems: PreExtractedItem[],
  sectionHeadings: string[],
  apiKey: string,
  model: string,
) {
  const totalShall = preExtractedItems.filter((i) => i.type === "shall").length;
  const totalMust  = preExtractedItems.filter((i) => i.type === "must").length;

  const itemsWithIds = preExtractedItems.map((item, idx) => ({
    id: `R-${String(idx + 1).padStart(3, "0")}`,
    type: item.type as "shall" | "must",
    text: item.text,
    supportingText: item.supportingText,
    documentName: item.documentName,
  }));

  if (itemsWithIds.length === 0) {
    return { requirements: [], totalShall: 0, totalMust: 0,
      summary: "No 'shall' or 'must' requirements were found in the RFP." };
  }

  const headingList = sectionHeadings.length > 0
    ? `Available section headings:\n${sectionHeadings.map((h) => `- ${h}`).join("\n")}`
    : "No explicit headings found; use descriptive topic labels.";

  const itemLines = itemsWithIds
    .map((item) => `${item.id} [${item.type.toUpperCase()}] "${item.text.slice(0, 120).replace(/"/g, "'")}..."`)
    .join("\n");

  const systemPrompt = `You are an RFP compliance analyst. For each requirement ID, assign the most appropriate section heading. Respond with valid JSON only — no markdown, no extra text.

${headingList}

Output format:
{
  "assignments": { "R-001": "<section>", "R-002": "<section>" },
  "summary": "<2-3 sentence executive summary of requirements scope>"
}`;

  const raw = await callClaude(apiKey, model, [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Assign sections for these ${itemsWithIds.length} requirements (${totalShall} shall, ${totalMust} must):\n\n${itemLines}` },
  ], "step1_sections");

  let assignments: Record<string, string> = {};
  let summary = `Found ${totalShall} SHALL and ${totalMust} MUST requirements in the RFP.`;
  try {
    const parsed = extractJSON(raw);
    assignments = parsed.assignments ?? {};
    if (parsed.summary) summary = parsed.summary;
  } catch { /* fall back */ }

  const requirements = itemsWithIds.map((item) => ({
    id: item.id, type: item.type, text: item.text,
    supportingText: item.supportingText, section: assignments[item.id] ?? "General",
  }));

  return { requirements, totalShall, totalMust, summary };
}

// ── Step 2: Build proposal outline ───────────────────────────────────────────
async function executeBuildOutline(
  requirementsResult: any,
  rfpDocuments: RFPDocument[],
  capabilityContext: string,
  apiKey: string,
  model: string,
): Promise<{ sections: Array<{ title: string; requirements: string[]; keyPoints: string[] }> }> {
  const reqSummary = requirementsResult.requirements
    .slice(0, 60)
    .map((r: any) => `${r.id} [${r.type.toUpperCase()}] [${r.section}] ${r.text.slice(0, 100)}`)
    .join("\n");

  const rfpSnippet = rfpDocuments.map((d) => `--- ${sanitize(d.name)} ---\n${sanitize(truncateDoc(d.content))}`).join("\n\n");

  const systemPrompt = `You are an expert government proposal writer. Create a structured proposal outline that addresses every mandatory requirement. Respond with valid JSON only — no markdown, no extra text.

Output format:
{
  "sections": [
    {
      "title": "<Section number and title>",
      "requirements": ["R-001", "R-005"],
      "keyPoints": ["<1-sentence description of what this section will cover>"]
    }
  ]
}

Rules:
- Every requirement ID must appear in at least one section
- Sections should mirror the RFP's structure where possible
- Include all standard government proposal sections: Executive Summary, Technical Approach, Management Approach, Past Performance, Schedule, Risk Management, Price/Cost Narrative, Architecture Diagram (placeholder)
- Aim for 8-12 sections`;

  const raw = await callClaude(apiKey, model, [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Create a proposal outline for an RFP with ${requirementsResult.totalShall} SHALL and ${requirementsResult.totalMust} MUST requirements.\n\nRFP Summary: ${requirementsResult.summary}\n\nRequirements:\n${reqSummary}\n\nRFP Content:\n${rfpSnippet}\n\n${capabilityContext ? "Company Capability Context:\n" + capabilityContext.slice(0, 4000) : ""}` },
  ], "step2_outline");

  try {
    return extractJSON(raw);
  } catch {
    return { sections: [
      { title: "1. Executive Summary", requirements: [], keyPoints: ["Overview of company and approach"] },
      { title: "2. Technical Approach", requirements: requirementsResult.requirements.slice(0, 20).map((r: any) => r.id), keyPoints: ["Address all technical requirements"] },
      { title: "3. Management Approach", requirements: [], keyPoints: ["Program management and staffing"] },
      { title: "4. Past Performance", requirements: [], keyPoints: ["Relevant past contracts and outcomes"] },
      { title: "5. Solution Architecture", requirements: [], keyPoints: ["[ARCHITECTURE DIAGRAM PLACEHOLDER]"] },
      { title: "6. Project Schedule", requirements: [], keyPoints: ["Phase-based timeline and milestones"] },
      { title: "7. Risk Management", requirements: [], keyPoints: ["Risk register and mitigations"] },
      { title: "8. Cost / Price Narrative", requirements: [], keyPoints: ["Pricing approach and assumptions"] },
    ]};
  }
}

// ── Step 3: Stream proposal text ──────────────────────────────────────────────
async function streamProposal(
  sendEvent: (payload: object) => Promise<void>,
  requirementsResult: any,
  outline: any,
  rfpDocuments: RFPDocument[],
  capabilityDocuments: RFPDocument[],
  companyName: string,
  capabilityContext: string,
  apiKey: string,
): Promise<void> {
  const reqList = requirementsResult.requirements
    .map((r: any) => `• ${r.id} [${r.type.toUpperCase()}] [Section: ${r.section}]: ${r.text.slice(0, 200)}`)
    .join("\n");

  const outlineText = outline.sections
    .map((s: any) => `${s.title}\n  Requirements: ${s.requirements.join(", ") || "general"}\n  Key points: ${s.keyPoints.join("; ")}`)
    .join("\n\n");

  const rfpText = rfpDocuments.map((d) => `=== ${sanitize(d.name)} ===\n${sanitize(truncateDoc(d.content))}`).join("\n\n");
  const capText = capabilityDocuments.map((d) => `=== ${sanitize(d.name)} ===\n${sanitize(truncateDoc(d.content))}`).join("\n\n");

  const systemPrompt = `You are an expert government contract proposal writer acting as a senior technical writer with 20+ years of federal contracting experience.

MISSION DIRECTIVE (from proposal management):
"Use the format and layouts of the provided reference documents to build a proposal based on the Request for Proposal. Make it look as much as possible like human written. The job of the agent is to take the uploaded documents, use PostgreSQL to index the information and do a retrieval, take a very detailed look at chapters, sections, important elements of 'must' and 'shall', and then generate a clear outline following point by point all the concerns, 'shall', and 'must' required by the request for proposal, and address these points using the capability statement of the company. The AI Agent will act as a human writer to accomplish this. Make the design of the proposal written professional, extremely well formatted with zero grammar mistakes. IT IS VERY IMPORTANT THAT ALL OF THE SHALL AND MUST ARE ADDRESSED. At the architecture stage, have a placeholder for the architecture diagram."

═══ ABSOLUTE RULES ═══
1. EVERY SHALL and MUST requirement listed in the Requirements Compliance Matrix below MUST be explicitly addressed in the proposal body — failure to address even one is a fatal non-compliance.
2. Write as a human: active voice, varied sentence structure, confident and specific. Never sound like AI.
3. Zero grammar or spelling errors. Use formal professional English.
4. Write with depth — each major section must be substantive (not one-liners).
5. Reference specific RFP section numbers when addressing requirements.
6. Use the company's capability statement and retrieved context to show HOW the company will comply — never just "we will comply."
7. Architecture section MUST contain the placeholder block exactly as specified.

═══ STRICT MARKDOWN FORMATTING RULES ═══
Every formatting element below is mandatory — no exceptions:

HEADINGS:
- # Section Title  ← one blank line before AND after every H1
- ## Subsection    ← one blank line before AND after every H2
- ### Sub-sub      ← one blank line before AND after every H3

PARAGRAPHS: Every paragraph separated by one blank line. Never run two paragraphs together.

COVER PAGE — use this exact template, one field per line, no prose:
# [PROPOSAL TITLE]
## [SUBTITLE / RFP DESCRIPTION]
**RFP Number:** [number]
**Issued by:** [agency name]

**Submitted by:**
[Company Name]
[Street Address]
[City, State ZIP]
**Telephone:** [phone]
**Email:** [email]
**UEI:** [UEI]  |  **CAGE Code:** [code]

**Procurement Contact:** [name, title]
[agency address]
**Email:** [email]

**Proposal Due Date:** [date and time]

BULLET LISTS — every item on its own line, preceded by a blank line, one blank line after the list:
- Item one
- Item two
- Item three

NUMBERED LISTS — same spacing rules as bullets:
1. First step
2. Second step

TABLES — blank line before AND after every table:

| Column A | Column B | Column C |
|----------|----------|----------|
| data     | data     | data     |

BLOCKQUOTES (architecture placeholder):
> [ARCHITECTURE DIAGRAM — Insert as Exhibit A]

HORIZONTAL RULES — use --- on its own line with blank lines around it.

NEVER merge address lines, contact info, or list items onto a single line.
NEVER skip blank lines between headings and body text.

GLOSSARIES AND ACRONYM LISTS — NEVER use a table. Format every glossary or acronym list as inline definition entries, one per line:

**ALM** — Application Lifecycle Management
**API** — Application Programming Interface
**RBAC** — Role-Based Access Control

TABLES — only use tables for: compliance matrices, risk registers, staffing matrices, schedule milestones, and performance metrics. Never use tables for glossaries, acronyms, or simple key-value lists.

Write naturally and professionally. Do not truncate any section — write every section completely before moving to the next.`;

  const userPrompt = `Write a complete, professional government contract technical proposal for **${companyName || "Our Company"}**.

---

**REQUIREMENTS COMPLIANCE MATRIX — ALL ${requirementsResult.totalShall} SHALL AND ${requirementsResult.totalMust} MUST REQUIREMENTS:**
${reqList}

---

**APPROVED PROPOSAL OUTLINE:**
${outlineText}

---

**RFP / SOLICITATION DOCUMENTS:**
${rfpText || "No RFP provided — write a general government IT services proposal."}

---

**COMPANY CAPABILITY DOCUMENTS:**
${capText || "No capability documents provided."}

---

**ADDITIONAL RETRIEVED CONTEXT FROM KNOWLEDGE BASE:**
${capabilityContext || "No additional context available."}

---

CRITICAL INSTRUCTIONS:
1. Write the ENTIRE proposal from start to finish — do NOT stop after the Table of Contents or after any single section.
2. Every section in the outline MUST be fully written with substantive content (minimum 3 paragraphs each).
3. Do not produce a summary or abbreviation of any section — write the full text.
4. After writing Section 1, immediately continue to Section 2, then Section 3, and so on until the last section.
5. End the proposal with the Requirements Compliance Matrix table showing every requirement ID and which section addresses it.

BEGIN THE COMPLETE PROPOSAL NOW:`;

  const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "anthropic-beta": "output-128k-2025-02-19",   // extended output tokens
    },
    body: sanitizeJson(JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 32000,   // extended — allows full multi-section proposals
      stream: true,
      system: sanitize(systemPrompt),
      messages: [{ role: "user", content: sanitize(userPrompt) }],
    })),
  });

  if (!anthropicResp.ok) {
    const errBody = await anthropicResp.text();
    throw new Error(`Claude streaming error (${anthropicResp.status}): ${errBody.slice(0, 300)}`);
  }

  const reader = anthropicResp.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
            const token = parsed.delta.text ?? "";
            if (token) await sendEvent({ type: "proposal_token", token });
          }
        } catch { /* skip malformed */ }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ── Agent Orchestrator ────────────────────────────────────────────────────────
async function runAgent(
  sendEvent: (payload: object) => Promise<void>,
  writer: WritableStreamDefaultWriter,
  rfpDocuments: RFPDocument[],
  capabilityDocuments: RFPDocument[],
  companyName: string,
  sessionId: string,
  preExtractedRequirements: PreExtractedItem[],
  sectionHeadings: string[],
  apiKey: string,
  azureEndpoint: string,
  azureApiKey: string,
  embeddingDeployment: string,
  apiVersion: string,
  pgUrl: string,
  supabaseDbUrl: string,
) {
  // Keep-alive heartbeat — sends a comment every 20 s to prevent proxy/CDN
  // from closing the SSE connection during long Claude API calls.
  const encoder = new TextEncoder();
  let heartbeatStopped = false;
  const heartbeat = setInterval(async () => {
    if (heartbeatStopped) return;
    try { await writer.write(encoder.encode(": heartbeat\n\n")); } catch { /* stream closed */ }
  }, 20_000);

  try {
    const haikuModel  = "claude-haiku-4-5-20251001";
    const sonnetModel = "claude-sonnet-4-6";

    // ── Step 1: Section-assign requirements ──
    await sendEvent({ type: "tool_start", tool: "extract_requirements",
      message: `Analysing ${preExtractedRequirements.filter(r => r.type === "shall").length} SHALL and ${preExtractedRequirements.filter(r => r.type === "must").length} MUST requirements — assigning sections...` });

    const requirementsResult = await executeExtractRequirements(
      preExtractedRequirements, sectionHeadings, apiKey, haikuModel,
    );
    await sendEvent({ type: "tool_result", tool: "extract_requirements", data: requirementsResult });

    // ── Step 2: Retrieve capability context ──
    await sendEvent({ type: "tool_start", tool: "retrieve_context",
      message: "Querying knowledge base for relevant capability information..." });

    const capabilityContext = await queryRelevantChunks(
      "technical capability experience certifications past performance qualifications methodology approach team",
      sessionId, pgUrl, azureEndpoint, azureApiKey, embeddingDeployment, apiVersion, 8,
    );
    const requirementsContext = await queryRelevantChunks(
      requirementsResult.requirements.slice(0, 5).map((r: any) => r.text).join(" "),
      sessionId, pgUrl, azureEndpoint, azureApiKey, embeddingDeployment, apiVersion, 6,
    );
    // Also query the permanent style/reference knowledge base (stored in Supabase)
    const styleTemplateContext = await queryKnowledgeBaseChunks(
      "proposal format style template management plan staffing past performance technical approach",
      supabaseDbUrl, azureEndpoint, azureApiKey, embeddingDeployment, apiVersion, 5,
    );
    const combinedContext = [capabilityContext, requirementsContext, styleTemplateContext].filter(Boolean).join("\n\n");

    await sendEvent({ type: "tool_start", tool: "retrieve_context",
      message: `Retrieved ${combinedContext ? "capability + style template context" : "context (knowledge base may not be indexed yet)"} from PostgreSQL.` });

    // ── Step 3: Build outline ──
    await sendEvent({ type: "tool_start", tool: "build_outline",
      message: "Building proposal outline — mapping each requirement to a section..." });

    const outline = await executeBuildOutline(
      requirementsResult, rfpDocuments, combinedContext, apiKey, sonnetModel,
    );
    await sendEvent({ type: "tool_result", tool: "build_outline", data: outline });

    await sendEvent({ type: "tool_start", tool: "build_outline",
      message: `Outline complete — ${outline.sections.length} sections planned. Starting proposal writing...` });

    // ── Step 4: Stream proposal ──
    await sendEvent({ type: "tool_start", tool: "write_proposal",
      message: `Writing full proposal — ${requirementsResult.totalShall + requirementsResult.totalMust} requirements to address. Streaming output...` });

    await streamProposal(
      sendEvent, requirementsResult, outline,
      rfpDocuments, capabilityDocuments, companyName, combinedContext, apiKey,
    );

    await sendEvent({ type: "agent_done",
      message: `Proposal complete. Addressed ${requirementsResult.totalShall} SHALL and ${requirementsResult.totalMust} MUST requirements.` });
  } catch (err) {
    await sendEvent({ type: "agent_error", message: err instanceof Error ? err.message : "Unknown error" });
  } finally {
    heartbeatStopped = true;
    clearInterval(heartbeat);
    await writer.close();
  }
}

// ── Main Handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      rfpDocuments, capabilityDocuments, companyName, sessionId,
      preExtractedRequirements, sectionHeadings,
    } = await req.json() as {
      rfpDocuments: RFPDocument[];
      capabilityDocuments: RFPDocument[];
      companyName?: string;
      sessionId?: string;
      preExtractedRequirements?: PreExtractedItem[];
      sectionHeadings?: string[];
    };

    const ANTHROPIC_API_KEY         = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
    const AZURE_OPENAI_ENDPOINT     = (Deno.env.get("AZURE_OPENAI_ENDPOINT") ?? "").replace(/\/+$/, "");
    const AZURE_OPENAI_API_KEY      = Deno.env.get("AZURE_OPENAI_API_KEY") ?? "";
    const AZURE_EMBEDDING_DEPLOYMENT = Deno.env.get("AZURE_OPENAI_EMBEDDING_DEPLOYMENT") ?? "text-embedding-ada-002";
    const AZURE_API_VERSION         = Deno.env.get("AZURE_OPENAI_API_VERSION") ?? "2024-08-01-preview";
    const AZURE_POSTGRES_URL        = Deno.env.get("AZURE_POSTGRES_URL") ?? "";
    // knowledge_base_chunks lives in Supabase (admin DB, pgvector pre-enabled)
    const SUPABASE_DB_URL           = Deno.env.get("SUPABASE_DB_URL") ?? "";

    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");
    if (!rfpDocuments || rfpDocuments.length === 0) throw new Error("No RFP documents provided.");

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const sendEvent = async (payload: object) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
    };

    // Fire-and-forget
    runAgent(
      sendEvent, writer,
      rfpDocuments, capabilityDocuments ?? [],
      companyName ?? "Our Company",
      sessionId ?? "",
      preExtractedRequirements ?? [],
      sectionHeadings ?? [],
      ANTHROPIC_API_KEY,
      AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY,
      AZURE_EMBEDDING_DEPLOYMENT, AZURE_API_VERSION,
      AZURE_POSTGRES_URL,
      SUPABASE_DB_URL,
    );

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" },
    });
  } catch (e) {
    console.error("write-proposal error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
