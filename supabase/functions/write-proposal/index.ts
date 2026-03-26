// @ts-nocheck — Deno edge function: VS Code TS checker doesn't understand Deno globals.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import Anthropic from "npm:@anthropic-ai/sdk";

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

// Remove lone Unicode surrogates — still needed even with the SDK since we pass
// text content in message objects and surrogates break JSON serialization.
function sanitize(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0xD800 && code <= 0xDBFF) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xDC00 && next <= 0xDFFF) { out += text[i] + text[i + 1]; i++; }
    } else if (code >= 0xDC00 && code <= 0xDFFF) {
      // lone low surrogate — drop
    } else {
      out += text[i];
    }
  }
  return out;
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
  const pg = new Client(pgUrl);
  await pg.connect();
  try {
    const embedding = await generateEmbeddingAzure(query, azureEndpoint, azureApiKey, embeddingDeployment, apiVersion);
    const result = await pg.queryObject<{ content: string; document_name: string }>(
      `SELECT content, document_name FROM document_chunks
       WHERE session_id = $1 ORDER BY embedding <=> $2::vector LIMIT $3`,
      [sessionId, `[${embedding.join(",")}]`, topK],
    );
    if (result.rows.length === 0) return "";
    return "\n--- Retrieved capability context ---\n" +
      result.rows.map((r) => `[${r.document_name}]:\n${r.content}`).join("\n\n---\n\n") +
      "\n--- End of retrieved context ---\n";
  } catch (e) {
    console.warn("pgvector query failed:", e);
    return "";
  } finally {
    await pg.end();
  }
}

async function queryKnowledgeBaseChunks(
  query: string, supabaseDbUrl: string,
  azureEndpoint: string, azureApiKey: string, embeddingDeployment: string, apiVersion: string,
  topK = 5,
): Promise<string> {
  if (!supabaseDbUrl || !azureEndpoint || !azureApiKey) return "";
  const pg = new Client(supabaseDbUrl);
  await pg.connect();
  try {
    const embedding = await generateEmbeddingAzure(query, azureEndpoint, azureApiKey, embeddingDeployment, apiVersion);
    const result = await pg.queryObject<{ content: string; document_name: string; category: string }>(
      `SELECT content, document_name, category FROM knowledge_base_chunks
       ORDER BY embedding <=> $1::vector LIMIT $2`,
      [`[${embedding.join(",")}]`, topK],
    );
    if (result.rows.length === 0) return "";
    return "\n--- Style & Reference Templates ---\n" +
      result.rows.map((r) => `[${r.document_name} | ${r.category}]:\n${r.content}`).join("\n\n---\n\n") +
      "\n--- End of style templates ---\n";
  } catch (e) {
    console.warn("knowledge_base_chunks query failed:", e);
    return "";
  } finally {
    await pg.end();
  }
}

// ── Anthropic SDK streaming helper ────────────────────────────────────────────
// Uses client.messages.create({ stream: true }) which returns a raw
// Stream<RawMessageStreamEvent> — a proper async iterable in Deno.
// (client.messages.stream().textStream is Node-only and undefined in Deno.)
//
// Returns proposalComplete=true ONLY when the sentinel marker is present.
// stop_reason "end_turn" is NOT sufficient — Claude regularly ends a turn at a
// sentence boundary mid-proposal without finishing all sections.
async function streamOnce(
  ai: Anthropic,
  sendEvent: (payload: object) => Promise<void>,
  model: string,
  system: string,
  messages: Anthropic.MessageParam[],
): Promise<{ proposalComplete: boolean; passText: string }> {
  const stream = await ai.messages.create({
    model,
    max_tokens: 8192,
    system: sanitize(system),
    messages,
    stream: true,
  });

  let passText = "";
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
      const token = (event.delta as any).text ?? "";
      if (token) {
        passText += token;
        await sendEvent({ type: "proposal_token", token });
      }
    }
  }

  const hasSentinel = passText.includes("<<<END_OF_PROPOSAL>>>");
  if (hasSentinel) {
    await sendEvent({ type: "proposal_strip_sentinel", sentinel: "<<<END_OF_PROPOSAL>>>" });
  }

  return { proposalComplete: hasSentinel, passText };
}

// ── Step 1: Assign requirements to sections ───────────────────────────────────
async function executeExtractRequirements(
  preExtractedItems: PreExtractedItem[],
  sectionHeadings: string[],
  ai: Anthropic,
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

  const response = await ai.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: sanitize(`You are an RFP compliance analyst. For each requirement ID, assign the most appropriate section heading. Respond with valid JSON only — no markdown, no extra text.\n\n${headingList}\n\nOutput format:\n{\n  "assignments": { "R-001": "<section>", "R-002": "<section>" },\n  "summary": "<2-3 sentence executive summary of requirements scope>"\n}`),
    messages: [{ role: "user", content: sanitize(`Assign sections for these ${itemsWithIds.length} requirements (${totalShall} shall, ${totalMust} must):\n\n${itemLines}`) }],
  });

  const raw = response.content[0]?.text ?? "";
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
  ai: Anthropic,
): Promise<{ sections: Array<{ title: string; requirements: string[]; keyPoints: string[] }> }> {
  const reqSummary = requirementsResult.requirements
    .slice(0, 60)
    .map((r: any) => `${r.id} [${r.type.toUpperCase()}] [${r.section}] ${r.text.slice(0, 100)}`)
    .join("\n");

  const rfpSnippet = rfpDocuments
    .map((d) => `--- ${sanitize(d.name)} ---\n${sanitize(truncateDoc(d.content))}`)
    .join("\n\n");

  const response = await ai.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: sanitize(`You are an expert government proposal writer. Create a structured proposal outline that addresses every mandatory requirement. Respond with valid JSON only — no markdown, no extra text.\n\nOutput format:\n{\n  "sections": [\n    {\n      "title": "<Section number and title>",\n      "requirements": ["R-001", "R-005"],\n      "keyPoints": ["<1-sentence description of what this section will cover>"]\n    }\n  ]\n}\n\nRules:\n- Every requirement ID must appear in at least one section\n- Sections should mirror the RFP structure where possible\n- Include all standard sections: Executive Summary, Technical Approach, Management Approach, Past Performance, Schedule, Risk Management, Price/Cost Narrative, Architecture Diagram (placeholder)\n- Aim for 8-12 sections`),
    messages: [{
      role: "user",
      content: sanitize(`Create a proposal outline for an RFP with ${requirementsResult.totalShall} SHALL and ${requirementsResult.totalMust} MUST requirements.\n\nRFP Summary: ${requirementsResult.summary}\n\nRequirements:\n${reqSummary}\n\nRFP Content:\n${rfpSnippet}\n\n${capabilityContext ? "Company Capability Context:\n" + capabilityContext.slice(0, 4000) : ""}`),
    }],
  });

  const raw = response.content[0]?.text ?? "";
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

// ── Step 3: Stream first proposal pass ───────────────────────────────────────
async function streamProposal(
  sendEvent: (payload: object) => Promise<void>,
  requirementsResult: any,
  outline: any,
  rfpDocuments: RFPDocument[],
  capabilityDocuments: RFPDocument[],
  companyName: string,
  capabilityContext: string,
  ai: Anthropic,
): Promise<{ proposalComplete: boolean }> {
  const reqList = requirementsResult.requirements
    .map((r: any) => `• ${r.id} [${r.type.toUpperCase()}] [Section: ${r.section}]: ${r.text.slice(0, 200)}`)
    .join("\n");

  const outlineText = outline.sections
    .map((s: any) => `${s.title}\n  Requirements: ${s.requirements.join(", ") || "general"}\n  Key points: ${s.keyPoints.join("; ")}`)
    .join("\n\n");

  const rfpText = rfpDocuments.map((d) => `=== ${sanitize(d.name)} ===\n${sanitize(truncateDoc(d.content))}`).join("\n\n");
  const capText = capabilityDocuments.map((d) => `=== ${sanitize(d.name)} ===\n${sanitize(truncateDoc(d.content))}`).join("\n\n");

  const system = `You are an expert government contract proposal writer acting as a senior technical writer with 20+ years of federal contracting experience.

MISSION DIRECTIVE: Use the format and layouts of the provided reference documents to build a proposal based on the RFP. Make it look as much as possible like human written. Address every 'shall' and 'must' requirement using the company capability statement. Act as a human writer — professional, extremely well formatted, zero grammar mistakes.

═══ ABSOLUTE RULES ═══
1. EVERY SHALL and MUST requirement MUST be explicitly addressed — failure is fatal non-compliance.
2. Active voice, varied sentence structure, confident and specific. Never sound like AI.
3. Zero grammar or spelling errors. Formal professional English.
4. Each major section must be substantive — minimum 3 full paragraphs.
5. Reference specific RFP section numbers when addressing requirements.
6. Show HOW the company will comply — never just "we will comply."
7. Architecture section MUST contain the placeholder block exactly as specified.

═══ STRICT MARKDOWN FORMATTING RULES ═══
HEADINGS: one blank line before AND after every # H1, ## H2, ### H3
PARAGRAPHS: separated by one blank line. Never run two paragraphs together.
COVER PAGE — exact template:
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

BULLET LISTS — blank line before and after:
- Item one
- Item two

NUMBERED LISTS — same spacing:
1. First step
2. Second step

TABLES — blank line before AND after:
| Column A | Column B |
|----------|----------|
| data     | data     |

ARCHITECTURE PLACEHOLDER:
> [ARCHITECTURE DIAGRAM — Insert as Exhibit A]

GLOSSARIES — NEVER use a table. One definition per line:
**ALM** — Application Lifecycle Management
**API** — Application Programming Interface

TABLES only for: compliance matrices, risk registers, staffing matrices, schedule milestones, performance metrics.

Write naturally and professionally. Do not truncate — write every section completely.`;

  const user = `Write a complete, professional government contract technical proposal for **${companyName || "Our Company"}**.

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
1. Write the ENTIRE proposal from start to finish — do NOT stop after any single section.
2. Every section in the outline MUST be fully written with substantive content (minimum 3 paragraphs).
3. Do not produce a summary or abbreviation — write the full text.
4. After Section 1, immediately continue to Section 2, then Section 3, and so on.
5. End with the Requirements Compliance Matrix table showing every requirement ID and which section addresses it.
6. When the proposal is FULLY complete, write this exact marker on its own line: <<<END_OF_PROPOSAL>>>

BEGIN THE COMPLETE PROPOSAL NOW:`;

  return streamOnce(ai, sendEvent, "claude-sonnet-4-6", system, [
    { role: "user", content: sanitize(user) },
  ]);
}

// ── Continuation pass (pass 2+) ───────────────────────────────────────────────
// Uses the planned section list to tell Claude exactly which sections are missing.
async function runContinuation(
  sendEvent: (payload: object) => Promise<void>,
  writer: WritableStreamDefaultWriter,
  continuationText: string,
  continuationPass: number,
  companyName: string,
  outlineSections: string[],
  ai: Anthropic,
): Promise<void> {
  const encoder = new TextEncoder();
  let heartbeatStopped = false;
  const heartbeat = setInterval(async () => {
    if (heartbeatStopped) return;
    try { await writer.write(encoder.encode(": heartbeat\n\n")); } catch { /* stream closed */ }
  }, 20_000);

  try {
    await sendEvent({
      type: "tool_start", tool: "write_proposal",
      message: `Continuation pass ${continuationPass} — writing remaining sections…`,
    });

    // Work out which planned sections are still missing by scanning headings
    // already present in the accumulated text.
    const cleanTitle = (t: string) => t.replace(/^\d+\.\s*/, "").toLowerCase().trim();
    const alreadyWritten = outlineSections.filter((t) =>
      continuationText.toLowerCase().includes(cleanTitle(t))
    );
    const stillNeeded = outlineSections.filter((t) =>
      !continuationText.toLowerCase().includes(cleanTitle(t))
    );

    const sectionStatus = outlineSections.length > 0
      ? `PLANNED SECTIONS:\n${outlineSections.map((s, i) => {
          const done = alreadyWritten.includes(s);
          return `  ${i + 1}. ${s} ${done ? "✓ written" : "← STILL NEEDED"}`;
        }).join("\n")}`
      : "";

    const missingList = stillNeeded.length > 0
      ? `\nSECTIONS STILL NEEDED (write ALL of these):\n${stillNeeded.map((s) => `  • ${s}`).join("\n")}\n`
      : "\nAll planned sections appear to be present — finish any incomplete section and write the Requirements Compliance Matrix.\n";

    const system = `You are an expert government contract proposal writer continuing a large proposal for ${companyName || "Our Company"}.

The proposal was cut off mid-generation due to output length limits. Your job is to continue writing from EXACTLY where it stopped.

RULES:
- Do NOT repeat, summarize, or restate anything already written.
- Pick up at the exact word where the text ends and continue seamlessly.
- Maintain identical tone, heading style, and Markdown formatting (blank lines around headings, bullets, tables).
- Write each missing section with full depth — minimum 3 substantive paragraphs per section.
- After ALL sections are written, end with <<<END_OF_PROPOSAL>>> on its own line.`;

    const user = `${sectionStatus}${missingList}
THE PROPOSAL SO FAR (last portion — DO NOT REPEAT):
${sanitize(continuationText.slice(-6000))}
--- END OF WHAT HAS BEEN WRITTEN ---

Continue writing from the exact word above. Write all remaining sections completely, then end with <<<END_OF_PROPOSAL>>>.`;

    const { proposalComplete } = await streamOnce(
      ai, sendEvent, "claude-sonnet-4-6", system,
      [{ role: "user", content: sanitize(user) }],
    );

    await sendEvent({
      type: "agent_done",
      proposalComplete,
      message: proposalComplete
        ? `Proposal complete after pass ${continuationPass}.`
        : `Pass ${continuationPass} done — more sections remaining…`,
    });
  } catch (err) {
    await sendEvent({ type: "agent_error", message: err instanceof Error ? err.message : "Unknown error" });
  } finally {
    heartbeatStopped = true;
    clearInterval(heartbeat);
    await writer.close();
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
  anthropicApiKey: string,
  azureEndpoint: string,
  azureApiKey: string,
  embeddingDeployment: string,
  apiVersion: string,
  pgUrl: string,
  supabaseDbUrl: string,
) {
  const encoder = new TextEncoder();
  let heartbeatStopped = false;
  const heartbeat = setInterval(async () => {
    if (heartbeatStopped) return;
    try { await writer.write(encoder.encode(": heartbeat\n\n")); } catch { /* stream closed */ }
  }, 20_000);

  // Create one Anthropic SDK client for all calls in this pipeline.
  // maxRetries=3 gives automatic exponential-backoff retries for 5xx/429.
  const ai = new Anthropic({ apiKey: anthropicApiKey, maxRetries: 3 });

  try {
    // ── Step 1 ──
    await sendEvent({ type: "tool_start", tool: "extract_requirements",
      message: `Analysing ${preExtractedRequirements.filter(r => r.type === "shall").length} SHALL and ${preExtractedRequirements.filter(r => r.type === "must").length} MUST requirements — assigning sections...` });

    const requirementsResult = await executeExtractRequirements(
      preExtractedRequirements, sectionHeadings, ai,
    );
    await sendEvent({ type: "tool_result", tool: "extract_requirements", data: requirementsResult });

    // ── Step 2 ──
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
    const styleTemplateContext = await queryKnowledgeBaseChunks(
      "proposal format style template management plan staffing past performance technical approach",
      supabaseDbUrl, azureEndpoint, azureApiKey, embeddingDeployment, apiVersion, 5,
    );
    const combinedContext = [capabilityContext, requirementsContext, styleTemplateContext].filter(Boolean).join("\n\n");

    await sendEvent({ type: "tool_start", tool: "retrieve_context",
      message: `Retrieved ${combinedContext ? "capability + style template context" : "context (knowledge base may not be seeded yet)"} from PostgreSQL.` });

    // ── Step 3 ──
    await sendEvent({ type: "tool_start", tool: "build_outline",
      message: "Building proposal outline — mapping each requirement to a section..." });

    const outline = await executeBuildOutline(requirementsResult, rfpDocuments, combinedContext, ai);
    await sendEvent({ type: "tool_result", tool: "build_outline", data: outline });
    await sendEvent({ type: "tool_start", tool: "build_outline",
      message: `Outline complete — ${outline.sections.length} sections planned. Starting proposal writing...` });

    // ── Step 4 ──
    await sendEvent({ type: "tool_start", tool: "write_proposal",
      message: `Writing full proposal — ${requirementsResult.totalShall + requirementsResult.totalMust} requirements to address. Streaming output...` });

    const { proposalComplete } = await streamProposal(
      sendEvent, requirementsResult, outline,
      rfpDocuments, capabilityDocuments, companyName, combinedContext, ai,
    );

    // Send outline section titles so the frontend can include them in continuation calls
    await sendEvent({
      type: "agent_done",
      proposalComplete,
      outlineSections: outline.sections.map((s: any) => s.title),
      message: proposalComplete
        ? `Proposal complete. Addressed ${requirementsResult.totalShall} SHALL and ${requirementsResult.totalMust} MUST requirements.`
        : `Pass 1 complete — proposal not finished yet. Continuing…`,
    });
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
    const body = await req.json() as {
      rfpDocuments?: RFPDocument[];
      capabilityDocuments?: RFPDocument[];
      companyName?: string;
      sessionId?: string;
      preExtractedRequirements?: PreExtractedItem[];
      sectionHeadings?: string[];
      continuationText?: string;
      continuationPass?: number;
      outlineSections?: string[];
    };

    const ANTHROPIC_API_KEY          = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
    const AZURE_OPENAI_ENDPOINT      = (Deno.env.get("AZURE_OPENAI_ENDPOINT") ?? "").replace(/\/+$/, "");
    const AZURE_OPENAI_API_KEY       = Deno.env.get("AZURE_OPENAI_API_KEY") ?? "";
    const AZURE_EMBEDDING_DEPLOYMENT = Deno.env.get("AZURE_OPENAI_EMBEDDING_DEPLOYMENT") ?? "text-embedding-ada-002";
    const AZURE_API_VERSION          = Deno.env.get("AZURE_OPENAI_API_VERSION") ?? "2024-08-01-preview";
    const AZURE_POSTGRES_URL         = Deno.env.get("AZURE_POSTGRES_URL") ?? "";
    const SUPABASE_DB_URL            = Deno.env.get("SUPABASE_DB_URL") ?? "";

    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const sendEvent = async (payload: object) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
    };

    const ai = new Anthropic({ apiKey: ANTHROPIC_API_KEY, maxRetries: 3 });

    // Continuation passes (2+): skip the full pipeline, stream directly
    if (body.continuationText && body.continuationPass && body.continuationPass > 1) {
      runContinuation(
        sendEvent, writer,
        body.continuationText,
        body.continuationPass,
        body.companyName ?? "Our Company",
        body.outlineSections ?? [],
        ai,
      );
    } else {
      // Pass 1: full agent pipeline
      if (!body.rfpDocuments || body.rfpDocuments.length === 0) {
        throw new Error("No RFP documents provided.");
      }
      runAgent(
        sendEvent, writer,
        body.rfpDocuments, body.capabilityDocuments ?? [],
        body.companyName ?? "Our Company",
        body.sessionId ?? "",
        body.preExtractedRequirements ?? [],
        body.sectionHeadings ?? [],
        ANTHROPIC_API_KEY,
        AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY,
        AZURE_EMBEDDING_DEPLOYMENT, AZURE_API_VERSION,
        AZURE_POSTGRES_URL, SUPABASE_DB_URL,
      );
    }

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    console.error("write-proposal error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
