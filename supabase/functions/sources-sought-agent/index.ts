// @ts-nocheck — Deno edge function: VS Code TS checker doesn't understand Deno globals.
// Runtime type safety is handled by Deno's own checker on deploy.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type RFPDocument = { name: string; content: string };

// ── Robust JSON extractor ─────────────────────────────────────────────────────
function repairJSON(raw: string): string {
  let out = "";
  let inStr = false;
  let escaped = false;

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
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
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

  for (const attempt of attempts) {
    try { return attempt(); } catch { /* try next */ }
  }
  console.error("extractJSON failed. Raw response (first 500 chars):", text.slice(0, 500));
  throw new Error("Failed to parse JSON from AI response");
}

const MAX_DOC_CHARS = 8_000;
function truncateDoc(content: string): string {
  if (content.length <= MAX_DOC_CHARS) return content;
  return content.slice(0, MAX_DOC_CHARS) + "\n\n[... document truncated for length ...]";
}

// ── Embedding helper ──────────────────────────────────────────────────────────
async function generateEmbedding(text: string, azureEndpoint: string, apiKey: string, embeddingDeployment: string, apiVersion: string): Promise<number[]> {
  const url = `${azureEndpoint}/openai/deployments/${embeddingDeployment}/embeddings?api-version=${apiVersion}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ input: text.slice(0, 8000) }),
  });
  if (!response.ok) throw new Error(`Azure OpenAI embedding error (${response.status})`);
  const data = await response.json();
  return data.data[0].embedding as number[];
}

// ── pgvector retrieval ────────────────────────────────────────────────────────
async function queryRelevantChunks(
  query: string, sessionId: string, pgUrl: string,
  azureEndpoint: string, apiKey: string, embeddingDeployment: string, apiVersion: string,
  topK = 5,
): Promise<string> {
  if (!sessionId || !pgUrl) return "";

  const client = new Client(pgUrl);
  await client.connect();
  try {
    const embedding = await generateEmbedding(query, azureEndpoint, apiKey, embeddingDeployment, apiVersion);
    const embeddingStr = `[${embedding.join(",")}]`;

    const result = await client.queryObject<{ content: string; document_name: string }>(
      `SELECT content, document_name
       FROM document_chunks
       WHERE session_id = $1
       ORDER BY embedding <=> $2::vector
       LIMIT $3`,
      [sessionId, embeddingStr, topK],
    );

    if (result.rows.length === 0) return "";

    return (
      "\n\n--- Relevant excerpts retrieved from indexed documents ---\n" +
      result.rows.map((r) => `[${r.document_name}]:\n${r.content}`).join("\n\n---\n\n") +
      "\n--- End of retrieved excerpts ---\n"
    );
  } catch (e) {
    console.warn("pgvector query failed (continuing without context):", e);
    return "";
  } finally {
    await client.end();
  }
}

// ── Claude chat helper ────────────────────────────────────────────────────────
async function callClaude(
  anthropicApiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  step = "unknown",
  maxRetries = 2,
  maxTokens = 8192,
): Promise<string> {
  const systemMsg = messages.find((m) => m.role === "system");
  const chatMessages = messages.filter((m) => m.role !== "system");

  const body: Record<string, unknown> = { model, max_tokens: maxTokens, messages: chatMessages };
  if (systemMsg) body.system = systemMsg.content;

  const bodyStr = JSON.stringify(body);
  let _lastStatus = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = _lastStatus === 529 ? 15_000 * attempt : 3_000 * attempt;
      console.log(`[${step}] Retry ${attempt}/${maxRetries} after ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }

    let response: Response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: bodyStr,
      });
    } catch (networkErr) {
      if (attempt < maxRetries) continue;
      throw new Error(`[${step}] Network error calling Claude: ${networkErr}`);
    }

    if (response.ok) {
      const data = await response.json();
      return data.content?.[0]?.text ?? "";
    }

    const status = response.status;
    _lastStatus = status;
    const errorBody = await response.text();
    console.error(`[${step}] Claude ${status} (attempt ${attempt + 1}):`, errorBody.slice(0, 300));

    if (status >= 500 && attempt < maxRetries) continue;
    if (status === 429) throw new Error(`[${step}] Rate limit exceeded. Please try again in a moment.`);

    let claudeMsg = errorBody.slice(0, 400);
    try { const parsed = JSON.parse(errorBody); claudeMsg = parsed?.error?.message ?? claudeMsg; } catch { /* ignore */ }
    throw new Error(`[${step}] Claude error (${status}): ${claudeMsg}`);
  }

  throw new Error(`[${step}] Claude failed after ${maxRetries + 1} attempts`);
}

type PreExtractedItem = {
  type: string;
  text: string;
  supportingText: string;
  documentName: string;
};

// ── Step 1: Extract Requirements ─────────────────────────────────────────────
async function executeExtractRequirements(
  preExtractedItems: PreExtractedItem[],
  sectionHeadings: string[],
  anthropicApiKey: string,
  claudeModel: string,
) {
  const totalShall = preExtractedItems.filter((i) => i.type === "shall").length;
  const totalMust = preExtractedItems.filter((i) => i.type === "must").length;

  const itemsWithIds = preExtractedItems.map((item, idx) => ({
    id: `R-${String(idx + 1).padStart(3, "0")}`,
    type: item.type as "shall" | "must",
    text: item.text,
    supportingText: item.supportingText,
    documentName: item.documentName,
  }));

  if (itemsWithIds.length === 0) {
    return {
      requirements: [],
      totalShall: 0,
      totalMust: 0,
      summary: "No 'shall' or 'must' requirements were found in the uploaded documents.",
    };
  }

  const headingList = sectionHeadings.length > 0
    ? `Available section headings:\n${sectionHeadings.map((h) => `- ${h}`).join("\n")}`
    : "No explicit headings were found; use descriptive topic labels.";

  const itemLines = itemsWithIds
    .map((item) => `${item.id} [${item.type.toUpperCase()}] "${item.text.slice(0, 120).replace(/"/g, "'")}..."`)
    .join("\n");

  const systemPrompt = `You are a Sources Sought / market research analyst. For each requirement ID listed below, assign the most appropriate section heading from the provided list (or a short descriptive label if none fits). Also write a 2-3 sentence executive summary focused on what the government is seeking.

${headingList}

You MUST respond with valid JSON only. No markdown fences, no text outside the JSON.

Output format:
{
  "assignments": {
    "R-001": "<section name>",
    "R-002": "<section name>"
  },
  "summary": "<2-3 sentence executive summary of what the government is seeking>"
}

Include an entry for every ID listed. Do not include any other fields.`;

  const userPrompt = `Assign sections for these ${itemsWithIds.length} requirements (${totalShall} shall, ${totalMust} must):\n\n${itemLines}`;

  const raw = await callClaude(anthropicApiKey, claudeModel, [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ], "step1_extract");

  let assignments: Record<string, string> = {};
  let summary = `Found ${totalShall} shall and ${totalMust} must requirements.`;
  try {
    const parsed = extractJSON(raw);
    assignments = parsed.assignments ?? {};
    if (parsed.summary) summary = parsed.summary;
  } catch { /* fall back */ }

  const requirements = itemsWithIds.map((item) => ({
    id: item.id,
    type: item.type,
    text: item.text,
    supportingText: item.supportingText,
    section: assignments[item.id] ?? "General",
  }));

  return { requirements, totalShall, totalMust, summary };
}

// ── Step 2: Evaluate Capability Match ─────────────────────────────────────────
async function executeEvaluateRFP(
  rfpDocuments: RFPDocument[],
  supplementaryDocument: RFPDocument | null,
  proposalType: string,
  retrievedContext: string,
  anthropicApiKey: string,
  claudeModel: string,
) {
  const rfpContext = rfpDocuments
    .map((d, i) => `--- Sources Sought Notice ${i + 1}: ${d.name} ---\n${truncateDoc(d.content)}`)
    .join("\n\n");

  const supplementaryContext = supplementaryDocument
    ? `--- Capability Statement: ${supplementaryDocument.name} ---\n${truncateDoc(supplementaryDocument.content)}`
    : "";

  const systemPrompt = `You are an expert government market research analyst. You evaluate how well a company's capabilities match what the government is seeking in a Sources Sought notice (market research or RFI).

A Sources Sought is not a formal solicitation — the government is gathering market intelligence to determine if qualified vendors exist before issuing an RFP. Your evaluation helps the company understand if they should respond and how strong their response would be.

You MUST respond with valid JSON only. No markdown, no explanation outside the JSON.

Respond with this exact JSON structure:
{
  "overallScore": <number 0-100>,
  "categories": [
    { "name": "<category name>", "score": <number 0-100>, "maxScore": 100 }
  ],
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...],
  "summary": "<2-3 sentence executive summary of the capability match>"
}

Categories to evaluate (score each 0-100):
1. Core Capability Match
2. Relevant Past Performance
3. Key Personnel & Expertise
4. Technical Approach Fit
5. Business Size & Certifications
6. Response Readiness

Keep each strength, weakness, recommendation to 1 sentence.`;

  const userPrompt = `Evaluate the following Sources Sought notice against the company's capability statement.
${retrievedContext}
Sources Sought Notice:
${rfpContext || "No Sources Sought documents provided."}

Company Capability Statement:
${supplementaryContext || "No capability statement provided."}

Analyze how well the company's qualifications match what the government is seeking. Score each category 0-100, identify strengths and weaknesses, and provide actionable recommendations for the Sources Sought response.`;

  const content = await callClaude(anthropicApiKey, claudeModel, [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ], "step2_evaluate");
  return extractJSON(content);
}

// ── Step 3: Identify Required Qualifications ──────────────────────────────────
async function executeRecommendTechStack(
  rfpDocuments: RFPDocument[],
  supplementaryDocument: RFPDocument | null,
  proposalType: string,
  retrievedContext: string,
  anthropicApiKey: string,
  claudeModel: string,
) {
  const rfpContext = rfpDocuments
    .map((d, i) => `--- Sources Sought Notice ${i + 1}: ${d.name} ---\n${truncateDoc(d.content)}`)
    .join("\n\n");

  const supplementaryContext = supplementaryDocument
    ? `--- Capability Statement: ${supplementaryDocument.name} ---\n${truncateDoc(supplementaryDocument.content)}`
    : "";

  const systemPrompt = `You are a government contracting specialist. Extract the qualifications, expertise, and certifications the government is seeking in a Sources Sought or RFI notice.

You MUST respond with valid JSON only. No markdown, no explanation outside the JSON.

Respond with this exact JSON structure:
{
  "technicalSkills": [
    { "skill": "<name>", "level": "required", "reason": "<brief reason, 10 words max>" }
  ],
  "techStack": [
    { "name": "<qualification or certification>", "category": "<Experience|Certification|Clearance|Methodology|Tool|Domain|Other>", "required": true }
  ]
}

List up to 10 technicalSkills and up to 15 qualifications. Use "required" or "preferred" for skill level.`;

  const userPrompt = `Analyze the following Sources Sought notice and identify the complete qualifications and certifications the government is seeking.
${retrievedContext}
Sources Sought Notice:
${rfpContext || "No Sources Sought documents provided."}

Company Capability Statement:
${supplementaryContext || "No capability statement provided."}

Extract all required and preferred qualifications (experience areas, certifications, clearances, methodologies, tools, domain expertise) from the Sources Sought notice.`;

  const content = await callClaude(anthropicApiKey, claudeModel, [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ], "step3_qualifications");
  return extractJSON(content);
}

// ── Step 4: Generate Capability Statement Outline ─────────────────────────────
async function executeGenerateSolution(
  rfpDocuments: RFPDocument[],
  supplementaryDocument: RFPDocument | null,
  proposalType: string,
  evaluationSummary: string,
  cloudProvider: string,
  retrievedContext: string,
  anthropicApiKey: string,
  claudeModel: string,
) {
  const rfpContext = rfpDocuments?.length > 0
    ? rfpDocuments.map((d, i) => `--- Sources Sought Notice ${i + 1}: ${d.name} ---\n${truncateDoc(d.content)}`).join("\n\n")
    : "";

  const supplementaryContext = supplementaryDocument
    ? `--- Capability Statement: ${supplementaryDocument.name} ---\n${truncateDoc(supplementaryDocument.content)}`
    : "";

  const systemPrompt = `You are an expert government contracting consultant. Given a Sources Sought notice and evaluation results, generate a recommended response structure and key talking points for the company's Sources Sought response (capability statement).

A Sources Sought response is typically 2-5 pages and focuses on: company overview, core competencies, relevant past performance, key personnel, certifications/clearances, and NAICS codes.

You MUST respond with valid JSON only. No markdown fences, no text outside the JSON.

Output this exact JSON structure:
{
  "solutionTitle": "<concise title for the Sources Sought response>",
  "solutionOverview": "<3-4 paragraph overview of the recommended response strategy in markdown format>",
  "keyComponents": [
    {
      "name": "<section name>",
      "description": "<what to include in this section>",
      "cloudProvider": "general",
      "rfpQuotes": ["<exact quote from Sources Sought that this section addresses>"]
    }
  ],
  "nodes": [
    {
      "id": "<unique id>",
      "label": "<section or capability name>",
      "abbr": "<2-4 letter abbreviation>",
      "description": "<short description>",
      "x": <number>,
      "y": <number>,
      "color": "<hex color>",
      "textColor": "text-white"
    }
  ],
  "edges": [
    {
      "id": "<unique id>",
      "source": "<node id>",
      "target": "<node id>",
      "animated": <true|false>,
      "label": "<optional description>"
    }
  ]
}

Response structure guidelines:
- Recommend 5-7 sections covering the standard Sources Sought response format
- For each section, extract 1-2 direct quotes from the Sources Sought that the section addresses
- The diagram should show the response structure as interconnected capability areas
- Use professional colors: #1B2A4A (navy), #4A6FA5 (blue), #1B4D2E (green), #8B1A1A (red), #4A1A8C (purple)
- Space nodes with ~220px horizontal gaps and ~130px vertical gaps`;

  const userPrompt = `Based on the following Sources Sought notice and evaluation, generate a recommended response structure.
${retrievedContext}
Sources Sought Notice:
${rfpContext || "No Sources Sought documents provided."}

${supplementaryContext ? `Company Capability Statement:\n${supplementaryContext}\n` : ""}

${evaluationSummary ? `Capability Assessment Summary:\n${evaluationSummary}\n` : ""}

Generate a response structure that addresses the government's market research objectives and showcases the company's relevant capabilities.`;

  const content = await callClaude(anthropicApiKey, claudeModel, [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ], "step4_response_structure");
  const parsed = extractJSON(content);
  if (!parsed.solutionTitle || !parsed.nodes || !parsed.edges) {
    throw new Error("AI did not return structured response data");
  }
  return parsed;
}

// ── Agent Orchestrator ────────────────────────────────────────────────────────
async function runAgent(
  sendEvent: (payload: object) => Promise<void>,
  writer: WritableStreamDefaultWriter,
  rfpDocuments: RFPDocument[],
  supplementaryDocument: RFPDocument | null,
  proposalType: string,
  cloudProvider: string,
  sessionId: string,
  anthropicApiKey: string,
  claudeModel: string,
  azureEndpoint: string,
  azureApiKey: string,
  embeddingDeployment: string,
  apiVersion: string,
  pgUrl: string,
  preExtractedRequirements: PreExtractedItem[],
  sectionHeadings: string[],
) {
  try {
    const haikuModel = "claude-haiku-4-5-20251001";
    await sendEvent({ type: "tool_start", tool: "extract_requirements", message: `Processing ${preExtractedRequirements.length} pre-extracted requirements from Sources Sought notice...` });
    const requirementsResult = await executeExtractRequirements(
      preExtractedRequirements, sectionHeadings, anthropicApiKey, haikuModel,
    );
    await sendEvent({ type: "tool_result", tool: "extract_requirements", data: requirementsResult });

    await sendEvent({ type: "tool_start", tool: "evaluate_rfp", message: "Retrieving relevant capability context for assessment..." });
    const evaluationContext = await queryRelevantChunks(
      "qualifications experience certifications past performance capabilities expertise",
      sessionId, pgUrl, azureEndpoint, azureApiKey, embeddingDeployment, apiVersion,
    );

    await sendEvent({ type: "tool_start", tool: "evaluate_rfp", message: "Assessing company capability match against Sources Sought requirements..." });
    const evaluationResult = await executeEvaluateRFP(
      rfpDocuments, supplementaryDocument, proposalType, evaluationContext, anthropicApiKey, claudeModel,
    );
    await sendEvent({ type: "tool_result", tool: "evaluate_rfp", data: evaluationResult });

    await sendEvent({ type: "tool_start", tool: "recommend_tech_stack", message: "Retrieving context for qualification analysis..." });
    const techStackContext = await queryRelevantChunks(
      "certifications clearances expertise methodology domain experience tools",
      sessionId, pgUrl, azureEndpoint, azureApiKey, embeddingDeployment, apiVersion,
    );

    await sendEvent({ type: "tool_start", tool: "recommend_tech_stack", message: "Identifying required qualifications and certifications..." });
    const techStackResult = await executeRecommendTechStack(
      rfpDocuments, supplementaryDocument, proposalType, techStackContext, anthropicApiKey, claudeModel,
    );
    await sendEvent({ type: "tool_result", tool: "recommend_tech_stack", data: techStackResult });

    await sendEvent({ type: "tool_start", tool: "generate_solution", message: "Retrieving context for response structure planning..." });
    const solutionContext = await queryRelevantChunks(
      "past performance contract experience capability statement company overview",
      sessionId, pgUrl, azureEndpoint, azureApiKey, embeddingDeployment, apiVersion,
    );

    await sendEvent({ type: "tool_start", tool: "generate_solution", message: "Generating recommended Sources Sought response structure..." });
    const evaluationSummary = `Score: ${evaluationResult.overallScore}/100. ${evaluationResult.summary}`;
    const solutionResult = await executeGenerateSolution(
      rfpDocuments, supplementaryDocument, proposalType, evaluationSummary, cloudProvider, solutionContext, anthropicApiKey, claudeModel,
    );
    await sendEvent({ type: "tool_result", tool: "generate_solution", data: solutionResult });

    await sendEvent({ type: "agent_done", message: "All steps complete. Your Sources Sought capability assessment is ready." });
  } catch (err) {
    await sendEvent({ type: "agent_error", message: err instanceof Error ? err.message : "Unknown error" });
  } finally {
    await writer.close();
  }
}

// ── Main Handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { rfpDocuments, supplementaryDocument, proposalType, cloudProvider, sessionId, preExtractedRequirements, sectionHeadings } =
      await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
    const CLAUDE_MODEL = Deno.env.get("CLAUDE_MODEL") ?? "claude-sonnet-4-6";
    const AZURE_OPENAI_ENDPOINT = (Deno.env.get("AZURE_OPENAI_ENDPOINT") ?? "").replace(/\/+$/, "");
    const AZURE_OPENAI_API_KEY = Deno.env.get("AZURE_OPENAI_API_KEY") ?? "";
    const AZURE_OPENAI_EMBEDDING_DEPLOYMENT = Deno.env.get("AZURE_OPENAI_EMBEDDING_DEPLOYMENT") ?? "text-embedding-ada-002";
    const AZURE_OPENAI_API_VERSION = Deno.env.get("AZURE_OPENAI_API_VERSION") ?? "2024-08-01-preview";
    const SUPABASE_DB_URL = Deno.env.get("SUPABASE_DB_URL") ?? "";

    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!rfpDocuments || rfpDocuments.length === 0) {
      return new Response(JSON.stringify({ error: "No Sources Sought documents provided." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const sendEvent = async (payload: object) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
    };

    runAgent(
      sendEvent, writer,
      rfpDocuments, supplementaryDocument,
      proposalType, cloudProvider ?? "general",
      sessionId ?? "",
      ANTHROPIC_API_KEY, CLAUDE_MODEL,
      AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY,
      AZURE_OPENAI_EMBEDDING_DEPLOYMENT, AZURE_OPENAI_API_VERSION,
      SUPABASE_DB_URL,
      preExtractedRequirements ?? [],
      sectionHeadings ?? [],
    );

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    console.error("sources-sought-agent error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
