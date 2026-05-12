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
async function streamOnce(
  ai: Anthropic,
  sendEvent: (payload: object) => Promise<void>,
  model: string,
  system: string,
  messages: Anthropic.MessageParam[],
): Promise<{ proposalComplete: boolean; stopReason: string; passText: string }> {
  const stream = await ai.messages.create({
    model,
    max_tokens: 8192,
    system: sanitize(system),
    messages,
    stream: true,
  });

  let passText = "";
  let stopReason = "end_turn";

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
      const token = (event.delta as any).text ?? "";
      if (token) {
        passText += token;
        await sendEvent({ type: "proposal_token", token });
      }
    }
    if (event.type === "message_delta" && (event as any).delta?.stop_reason) {
      stopReason = (event as any).delta.stop_reason;
    }
  }

  const hasSentinel = passText.includes("<<<END_OF_PROPOSAL>>>");
  const proposalComplete = hasSentinel && stopReason !== "max_tokens";

  if (hasSentinel && proposalComplete) {
    await sendEvent({ type: "proposal_strip_sentinel", sentinel: "<<<END_OF_PROPOSAL>>>" });
  }

  return { proposalComplete, stopReason, passText };
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
      summary: "No explicit requirements found in the Sources Sought notice." };
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
    system: sanitize(`You are a Sources Sought analyst. For each requirement ID, assign the most appropriate section heading. Respond with valid JSON only — no markdown, no extra text.\n\n${headingList}\n\nOutput format:\n{\n  "assignments": { "R-001": "<section>", "R-002": "<section>" },\n  "summary": "<2-3 sentence summary of what the government is seeking>"\n}`),
    messages: [{ role: "user", content: sanitize(`Assign sections for these ${itemsWithIds.length} requirements (${totalShall} shall, ${totalMust} must):\n\n${itemLines}`) }],
  });

  const raw = response.content[0]?.text ?? "";
  let assignments: Record<string, string> = {};
  let summary = `Found ${totalShall} SHALL and ${totalMust} MUST requirements in the Sources Sought notice.`;
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

// ── Step 2: Build Sources Sought response outline ─────────────────────────────
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
    system: sanitize(`You are an expert government contracting consultant. Create a structured outline for a Sources Sought response. The response is a FORMAL LETTER (3-5 pages) — not a proposal. Respond with valid JSON only — no markdown, no extra text.\n\nOutput format:\n{\n  "sections": [\n    {\n      "title": "<Section number and title>",\n      "requirements": ["R-001", "R-005"],\n      "keyPoints": ["<1-sentence description of what this section will cover>"]\n    }\n  ]\n}\n\nRules:\n- A Sources Sought response is a formal letter — 3-5 pages, concise and targeted\n- REQUIRED sections in this order: Opening Letter/Reference (letterhead, date, attention block, reference line, salutation, opening paragraphs), 1. Submittal Intention, 2. Company Profile (employees, office, single bonding, aggregate bonding, DUNS, CAGE, SB designation, Responsible Office/Contact), 3. Relevant Experience (4-8 structured past performance entries)\n- NO price or cost section (Sources Sought is market research only)\n- Every government information request should map to at least one section\n- Keep to exactly 4 sections following the formal letter structure`),
    messages: [{
      role: "user",
      content: sanitize(`Create a Sources Sought response outline for a notice with ${requirementsResult.totalShall} SHALL and ${requirementsResult.totalMust} MUST information requests.\n\nNotice Summary: ${requirementsResult.summary}\n\nRequirements:\n${reqSummary}\n\nNotice Content:\n${rfpSnippet}\n\n${capabilityContext ? "Company Capability Context:\n" + capabilityContext.slice(0, 4000) : ""}`),
    }],
  });

  const raw = response.content[0]?.text ?? "";
  try {
    return extractJSON(raw);
  } catch {
    return { sections: [
      { title: "Opening Letter", requirements: [], keyPoints: ["Letterhead, date, attention block, reference line, salutation, opening paragraph, background paragraph"] },
      { title: "1. Submittal Intention", requirements: requirementsResult.requirements.slice(0, 5).map((r: any) => r.id), keyPoints: ["Team assembled statement, statement of interest, relevant geographic or domain experience"] },
      { title: "2. Company Profile", requirements: [], keyPoints: ["Employees, office location, single/aggregate bonding, DUNS, CAGE, SB designation, Responsible Office/Contact Person two-column block"] },
      { title: "3. Relevant Experience", requirements: requirementsResult.requirements.slice(5, 20).map((r: any) => r.id), keyPoints: ["4-8 past performance entries with Role, Contract Value, POC, Tel, Timeliness, Customer Satisfaction, Scope"] },
    ]};
  }
}

// ── Step 3: Stream Sources Sought response ────────────────────────────────────
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
    .map((r: any) => `- ${r.id} [${r.type.toUpperCase()}] [Section: ${r.section}]: ${r.text.slice(0, 200)}`)
    .join("\n");

  const outlineText = outline.sections
    .map((s: any) => `${s.title}\n  Info Requests: ${s.requirements.join(", ") || "general"}\n  Key points: ${s.keyPoints.join("; ")}`)
    .join("\n\n");

  const rfpText = rfpDocuments.map((d) => `=== ${sanitize(d.name)} ===\n${sanitize(truncateDoc(d.content))}`).join("\n\n");
  const capText = capabilityDocuments.map((d) => `=== ${sanitize(d.name)} ===\n${sanitize(truncateDoc(d.content))}`).join("\n\n");

  const system = `You are an expert government contracting consultant writing a Sources Sought response on behalf of a company.

A Sources Sought is a government market research tool — NOT a formal solicitation. The response is a FORMAL BUSINESS LETTER (3-5 pages). It demonstrates the company's qualifications and interest. It does NOT include a price section.

MISSION DIRECTIVE: Write the response as a formal letter following the EXACT structure below. Use the company's capability documents for specific, factual content. Write naturally and professionally — not like AI.

ABSOLUTE RULES:
1. Address EVERY information request from the Sources Sought notice.
2. NO price, cost estimate, or pricing section.
3. Active voice, confident and specific. Never sound like AI.
4. Zero grammar or spelling errors. Formal professional English.
5. NEVER use em dashes (--) or en dashes. Use commas, semicolons, colons, or rewrite instead.
6. NEVER use curly/smart quotes. Use only straight quotation marks and apostrophes.
7. NEVER use decorative bullets (bullets, middle dots, triangles). Use only standard Markdown hyphens (-) for lists.

REQUIRED DOCUMENT STRUCTURE — follow this EXACT format in order:

--- LETTERHEAD / HEADER ---
[Company Name]
[Street Address, City, State ZIP]
P: [phone] | F: [fax]
Certifications: [e.g., 8(a) Certified | Small Business | DBE | LEED AP]

[Month Day, Year]

[Agency / Contracting Office Name]
[Street Address]
[City, State ZIP]

**Reference: Statement of Capability to Provide [Services] for [Project Title]. (Sol. #[Number])**

To whom it may concern,

[OPENING PARAGRAPH: Company name, location, certifications (8(a), Small Business, DBE, etc.), statement of intent to submit capability, one sentence on core specialization.]

[BACKGROUND PARAGRAPH: Number of contracts completed, years in program (e.g., SBA 8(a)), specialization areas, on-time/on-budget track record, customer satisfaction highlight.]

**SUBMITTAL REQUIREMENTS:**

**1. Submittal Intention:**

[Team assembled statement, statement of interest in the project, relevant geographic or domain experience. 2-3 sentences.]

**2. Company Profile:**

(1.) Number of employees:        [X]
(2.) Office location:            [Street, City, State ZIP]
(3.) Single bonding capacity:    $[X]
(4.) Aggregate bonding capacity: $[X]
(5.) DUNS number:                [X]
(6.) CAGE code:                  [X]
(7.) Small business designation/status claimed: [8(a) / HUBZone / SDVOSB / WOSB / etc.]

Responsible Office              Contact Person
[Company Name]                  [Name, Credentials]
[Street Address]                [Title]
[City, State ZIP]               Mobile: [phone]
P: [phone]                      Email: [email]
F: [fax]

**3. Relevant Experience:**

[4-8 past performance entries. Each MUST follow this exact structure:]

- [Project Name] ([Year or "In Progress"])
  Role:                     Prime Contractor / Sub Contractor
  Contract Value:           $[X]
  Point Of Contact:         [Name] - [Title]
  Tel. Number:              [phone]
  Timeliness of Perform.:   Finished on schedule / Finished ahead of schedule
  Customer Satisfaction:    [specific outcome, e.g., "Zero call back and zero warranty issues"]
  Scope:                    [2-4 sentences describing work performed, starting with an action verb]

List most relevant projects first. Use data from capability documents when available.

FORMATTING RULES:
- Paragraphs separated by one blank line.
- Use **bold** for section labels and field names.
- Bullet lists: blank line before and after.
- This is a formal letter — do not use H1/H2/H3 markdown headers inside the body. Use bold text for section labels.`;

  const user = `Write a complete, professional Sources Sought response for **${companyName || "Our Company"}**.

---

**INFORMATION REQUESTS FROM SOURCES SOUGHT (${requirementsResult.totalShall + requirementsResult.totalMust} total):**
${reqList}

---

**APPROVED RESPONSE OUTLINE:**
${outlineText}

---

**SOURCES SOUGHT NOTICE:**
${rfpText || "No Sources Sought notice provided — write a general capability statement."}

---

**COMPANY CAPABILITY DOCUMENTS:**
${capText || "No capability documents provided."}

---

**ADDITIONAL RETRIEVED CONTEXT FROM KNOWLEDGE BASE:**
${capabilityContext || "No additional context available."}

---

CRITICAL INSTRUCTIONS:
1. Write the ENTIRE response from start to finish — all ${outline.sections.length} sections.
2. Keep each section concise but substantive — this is a 2-5 page document.
3. Do NOT include any price or cost information.
4. After ALL sections are written, end with <<<END_OF_PROPOSAL>>> on its own line.
5. ONLY write <<<END_OF_PROPOSAL>>> after ALL sections are fully written.
6. If you reach your output limit before finishing, stop cleanly at the end of a sentence. Do NOT write <<<END_OF_PROPOSAL>>> unless everything is truly done.

BEGIN THE COMPLETE SOURCES SOUGHT RESPONSE NOW:`;

  return streamOnce(ai, sendEvent, "claude-sonnet-4-6", system, [
    { role: "user", content: sanitize(user) },
  ]);
}

// ── Modification pass ─────────────────────────────────────────────────────────
async function runModification(
  sendEvent: (payload: object) => Promise<void>,
  writer: WritableStreamDefaultWriter,
  existingProposalText: string,
  modificationInstructions: string,
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
    await sendEvent({ type: "tool_start", tool: "write_proposal",
      message: "Applying modifications to Sources Sought response..." });

    const sections = outlineSections.length > 0
      ? outlineSections
      : (existingProposalText.match(/^#{1,2} .+/gm) ?? []).map((h) => h.replace(/^#{1,2} /, ""));

    const system = `You are an expert government contracting consultant. You will receive an existing Sources Sought response (a formal business letter) and update instructions. Apply all requested changes while preserving the formal letter format: letterhead, date, attention block, reference line, salutation, opening paragraphs, and SUBMITTAL REQUIREMENTS sections (1. Submittal Intention, 2. Company Profile, 3. Relevant Experience). Output the COMPLETE updated response. After ALL sections are written, end with <<<END_OF_PROPOSAL>>> on its own line.

FORMATTING RULES:
- Preserve the formal letter structure — do not convert to headers or a proposal format.
- NEVER use em dashes (--) or en dashes. Use commas, semicolons, colons, or rewrite instead.
- NEVER use curly/smart quotes. Use straight quotation marks and apostrophes only.
- NEVER use decorative bullets. Use only standard Markdown hyphens (-).
- NO price or cost information.
- Company Profile section must retain all numbered fields: employees, office, single bonding, aggregate bonding, DUNS, CAGE, SB status, Responsible Office/Contact Person block.
- Relevant Experience entries must retain all structured fields: Role, Contract Value, Point Of Contact, Tel. Number, Timeliness of Perform., Customer Satisfaction, Scope.`;

    const user = `Apply the following updates to the Sources Sought response below.

UPDATE INSTRUCTIONS:
${sanitize(modificationInstructions)}

---

CURRENT SOURCES SOUGHT RESPONSE (apply updates to this):
${sanitize(existingProposalText.slice(0, 60_000))}

---

Output the complete updated response with all changes applied. End with <<<END_OF_PROPOSAL>>> after the final section.`;

    const { proposalComplete } = await streamOnce(
      ai, sendEvent, "claude-sonnet-4-6", system,
      [{ role: "user", content: sanitize(user) }],
    );

    await sendEvent({
      type: "agent_done",
      proposalComplete,
      outlineSections: sections,
      message: proposalComplete
        ? "Modifications applied successfully."
        : "First modification pass complete — continuing...",
    });
  } catch (err) {
    await sendEvent({ type: "agent_error", message: err instanceof Error ? err.message : "Unknown error" });
  } finally {
    heartbeatStopped = true;
    clearInterval(heartbeat);
    await writer.close();
  }
}

// ── Continuation pass (pass 2+) ───────────────────────────────────────────────
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
      message: `Continuation pass ${continuationPass} — writing remaining sections...`,
    });

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
          return `  ${i + 1}. ${s} ${done ? "- written" : "<-- STILL NEEDED"}`;
        }).join("\n")}`
      : "";

    const missingList = stillNeeded.length > 0
      ? `\nSECTIONS STILL NEEDED (write ALL of these):\n${stillNeeded.map((s) => `  - ${s}`).join("\n")}\n`
      : "\nAll planned sections appear to be present — finish any incomplete section.\n";

    const system = `You are an expert government contracting consultant continuing a Sources Sought response (formal business letter) for ${companyName || "Our Company"}.

The response was cut off mid-generation due to output length limits. Continue writing from EXACTLY where it stopped.

RULES:
- Do NOT repeat, summarize, or restate anything already written.
- Pick up at the exact word where the text ends and continue seamlessly.
- Maintain identical formal letter tone, bold section labels, and Markdown formatting (no H1/H2 headers inside the body).
- If continuing Relevant Experience entries, each entry must include: Role, Contract Value, Point Of Contact, Tel. Number, Timeliness of Perform., Customer Satisfaction, Scope.
- Keep sections concise — this is a 3-5 page formal letter, not a full proposal.
- NO price or cost information.
- After ALL sections are written, end with <<<END_OF_PROPOSAL>>> on its own line.`;

    const user = `${sectionStatus}${missingList}
THE SOURCES SOUGHT RESPONSE SO FAR (last portion — DO NOT REPEAT):
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
        ? `Sources Sought response complete after pass ${continuationPass}.`
        : `Pass ${continuationPass} done — more sections remaining...`,
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

  const ai = new Anthropic({ apiKey: anthropicApiKey, maxRetries: 3 });

  try {
    await sendEvent({ type: "tool_start", tool: "extract_requirements",
      message: `Analysing ${preExtractedRequirements.filter(r => r.type === "shall").length} SHALL and ${preExtractedRequirements.filter(r => r.type === "must").length} MUST requirements — assigning sections...` });

    const requirementsResult = await executeExtractRequirements(
      preExtractedRequirements, sectionHeadings, ai,
    );
    await sendEvent({ type: "tool_result", tool: "extract_requirements", data: requirementsResult });

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
      "capability statement past performance company overview certifications key personnel",
      supabaseDbUrl, azureEndpoint, azureApiKey, embeddingDeployment, apiVersion, 5,
    );
    const combinedContext = [capabilityContext, requirementsContext, styleTemplateContext].filter(Boolean).join("\n\n");

    await sendEvent({ type: "tool_start", tool: "retrieve_context",
      message: `Retrieved ${combinedContext ? "capability context" : "context (knowledge base may not be seeded yet)"} from PostgreSQL.` });

    await sendEvent({ type: "tool_start", tool: "build_outline",
      message: "Building Sources Sought response outline..." });

    const outline = await executeBuildOutline(requirementsResult, rfpDocuments, combinedContext, ai);
    await sendEvent({ type: "tool_result", tool: "build_outline", data: outline });
    await sendEvent({ type: "tool_start", tool: "build_outline",
      message: `Outline complete — ${outline.sections.length} sections planned. Starting response writing...` });

    await sendEvent({ type: "tool_start", tool: "write_proposal",
      message: `Writing Sources Sought response — ${requirementsResult.totalShall + requirementsResult.totalMust} information requests to address. Streaming output...` });

    const { proposalComplete } = await streamProposal(
      sendEvent, requirementsResult, outline,
      rfpDocuments, capabilityDocuments, companyName, combinedContext, ai,
    );

    await sendEvent({
      type: "agent_done",
      proposalComplete,
      outlineSections: outline.sections.map((s: any) => s.title),
      message: proposalComplete
        ? `Sources Sought response complete. Addressed ${requirementsResult.totalShall} SHALL and ${requirementsResult.totalMust} MUST information requests.`
        : `Pass 1 complete — response not finished yet. Continuing...`,
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
      modificationInstructions?: string;
      existingProposalText?: string;
    };

    const ANTHROPIC_API_KEY          = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
    const AZURE_OPENAI_ENDPOINT      = (Deno.env.get("AZURE_OPENAI_ENDPOINT") ?? "").replace(/\/+$/, "");
    const AZURE_OPENAI_API_KEY       = Deno.env.get("AZURE_OPENAI_API_KEY") ?? "";
    const AZURE_EMBEDDING_DEPLOYMENT = Deno.env.get("AZURE_OPENAI_EMBEDDING_DEPLOYMENT") ?? "text-embedding-ada-002";
    const AZURE_API_VERSION          = Deno.env.get("AZURE_OPENAI_API_VERSION") ?? "2024-08-01-preview";
    const SUPABASE_DB_URL            = Deno.env.get("SUPABASE_DB_URL") ?? "";

    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    const sendEvent = async (payload: object) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
    };

    const ai = new Anthropic({ apiKey: ANTHROPIC_API_KEY, maxRetries: 3 });

    if (body.modificationInstructions && body.existingProposalText) {
      runModification(
        sendEvent, writer,
        body.existingProposalText,
        body.modificationInstructions,
        body.companyName ?? "Our Company",
        body.outlineSections ?? [],
        ai,
      );
    } else if (body.continuationText && body.continuationPass && body.continuationPass > 1) {
      runContinuation(
        sendEvent, writer,
        body.continuationText,
        body.continuationPass,
        body.companyName ?? "Our Company",
        body.outlineSections ?? [],
        ai,
      );
    } else {
      if (!body.rfpDocuments || body.rfpDocuments.length === 0) {
        throw new Error("No Sources Sought documents provided.");
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
        SUPABASE_DB_URL, SUPABASE_DB_URL,
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
    console.error("write-sources-sought error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
