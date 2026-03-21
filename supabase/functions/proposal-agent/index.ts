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
// Claude sometimes puts literal newlines / control chars inside string values,
// which makes JSON.parse throw. repairJSON fixes ONLY chars inside strings by
// scanning character-by-character — structural whitespace is left intact.
function repairJSON(raw: string): string {
  let out = "";
  let inStr = false;
  let escaped = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\" && inStr) {
      out += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inStr = !inStr;
      out += ch;
      continue;
    }

    if (inStr) {
      // Replace bare control characters with proper JSON escape sequences
      const code = ch.charCodeAt(0);
      if (ch === "\n") { out += "\\n"; continue; }
      if (ch === "\r") { out += "\\r"; continue; }
      if (ch === "\t") { out += "\\t"; continue; }
      if (code < 0x20) {
        out += "\\u" + code.toString(16).padStart(4, "0");
        continue;
      }
    }

    out += ch;
  }

  return out;
}

function extractJSON(text: string): any {
  // Helper: try to extract the outermost {...} block
  const slice = (s: string) => {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("no braces");
    return s.slice(start, end + 1);
  };

  const attempts: Array<() => any> = [
    // 1. Direct parse
    () => JSON.parse(text.trim()),
    // 2. Extract from markdown code fence, then parse
    () => {
      const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (!m) throw new Error("no fence");
      return JSON.parse(m[1].trim());
    },
    // 3. Outermost { … } slice
    () => JSON.parse(slice(text)),
    // 4. Repair control chars in strings, then slice + parse
    () => JSON.parse(slice(repairJSON(text))),
    // 5. Repair from inside a code fence
    () => {
      const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (!m) throw new Error("no fence");
      return JSON.parse(repairJSON(m[1].trim()));
    },
  ];

  for (const attempt of attempts) {
    try { return attempt(); } catch { /* try next */ }
  }
  // Log what Claude returned so we can debug the failure
  console.error("extractJSON failed. Raw response (first 500 chars):", text.slice(0, 500));
  throw new Error("Failed to parse JSON from AI response");
}

// ~8 000 chars ≈ ~2 000 tokens per doc — keeps total prompt within fast-response range
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
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text.slice(0, 8000),
    }),
  });
  if (!response.ok) {
    throw new Error(`Azure OpenAI embedding error (${response.status})`);
  }
  const data = await response.json();
  return data.data[0].embedding as number[];
}

// ── pgvector retrieval ────────────────────────────────────────────────────────

async function queryRelevantChunks(
  query: string,
  sessionId: string,
  pgUrl: string,
  azureEndpoint: string,
  apiKey: string,
  embeddingDeployment: string,
  apiVersion: string,
  topK = 5,
): Promise<string> {
  if (!sessionId || !pgUrl) return "";

  const client = new Client(pgUrl);
  await client.connect();
  try {
    const embedding = await generateEmbedding(query, azureEndpoint, apiKey, embeddingDeployment, apiVersion);
    const embeddingStr = `[${embedding.join(",")}]`;

    const result = await client.queryObject<{
      content: string;
      document_name: string;
    }>(
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
      result.rows
        .map((r) => `[${r.document_name}]:\n${r.content}`)
        .join("\n\n---\n\n") +
      "\n--- End of retrieved excerpts ---\n"
    );
  } catch (e) {
    // Non-fatal: if pgvector query fails, continue without context
    console.warn("pgvector query failed (continuing without context):", e);
    return "";
  } finally {
    await client.end();
  }
}

// ── Step 1: Extract Requirements ─────────────────────────────────────────────

// ── Claude (Anthropic) chat helper ───────────────────────────────────────────
// Claude separates the system prompt from the messages array and requires max_tokens.
// Messages must alternate user/assistant — no system role allowed in messages[].

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

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    messages: chatMessages,
  };
  if (systemMsg) body.system = systemMsg.content;

  const bodyStr = JSON.stringify(body);
  let _lastStatus = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      // Longer backoff for overload (529) vs gateway errors (502/503)
      const delay = _lastStatus === 529 ? 15_000 * attempt : 3_000 * attempt;
      console.log(`[${step}] Retry ${attempt}/${maxRetries} after ${delay}ms (last status: ${_lastStatus})...`);
      await new Promise((r) => setTimeout(r, delay));
    }

    console.log(`[${step}] POST https://api.anthropic.com/v1/messages model=${model} (attempt ${attempt + 1})`);

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
      if (attempt < maxRetries) continue; // retry on network error
      throw new Error(`[${step}] Network error calling Claude: ${networkErr}`);
    }

    if (response.ok) {
      const data = await response.json();
      const stopReason = data.stop_reason;
      if (stopReason === "max_tokens") {
        console.warn(`[${step}] WARNING: response hit max_tokens (${maxTokens}) and was truncated`);
      }
      return data.content?.[0]?.text ?? "";
    }

    const status = response.status;
    _lastStatus = status;
    const errorBody = await response.text();
    console.error(`[${step}] Claude ${status} (attempt ${attempt + 1}):`, errorBody.slice(0, 300));

    // Retry on 5xx (502, 503, 529 overloaded) but not on 4xx
    if (status >= 500 && attempt < maxRetries) continue;

    if (status === 429) throw new Error(`[${step}] Rate limit exceeded. Please try again in a moment.`);

    let claudeMsg = errorBody.slice(0, 400);
    try {
      const parsed = JSON.parse(errorBody);
      claudeMsg = parsed?.error?.message ?? claudeMsg;
    } catch { /* ignore */ }
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

async function executeExtractRequirements(
  preExtractedItems: PreExtractedItem[],
  sectionHeadings: string[],
  anthropicApiKey: string,
  claudeModel: string,
) {
  const totalShall = preExtractedItems.filter((i) => i.type === "shall").length;
  const totalMust = preExtractedItems.filter((i) => i.type === "must").length;

  // Assign IDs upfront — deterministic, not LLM-generated
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

  // LLM task: return ONLY a compact section-assignment map + summary.
  // We never ask it to echo requirement text back — that avoids JSON-breaking
  // characters (unescaped quotes, backslashes, control chars) from source docs.
  const headingList = sectionHeadings.length > 0
    ? `Available section headings:\n${sectionHeadings.map((h) => `- ${h}`).join("\n")}`
    : "No explicit headings were found; use descriptive topic labels.";

  // Send only id + a short text preview (first 120 chars) so the LLM can
  // understand the topic without repeating the full verbatim text in its output.
  const itemLines = itemsWithIds
    .map((item) =>
      `${item.id} [${item.type.toUpperCase()}] "${item.text.slice(0, 120).replace(/"/g, "'")}..."`
    )
    .join("\n");

  const systemPrompt = `You are an RFP compliance analyst. For each requirement ID listed below, assign the most appropriate section heading from the provided list (or a short descriptive label if none fits). Also write a 2–3 sentence executive summary.

${headingList}

You MUST respond with valid JSON only. No markdown fences, no text outside the JSON.

Output format — use ONLY short safe strings for section values, never copy requirement text:
{
  "assignments": {
    "R-001": "<section name>",
    "R-002": "<section name>"
  },
  "summary": "<2-3 sentence executive summary>"
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
  } catch {
    // Parsing failed — fall back to "General" for all sections
  }

  // Reconstruct full requirements server-side; requirement text comes exclusively
  // from the pre-extracted items (never from the LLM), so JSON safety is guaranteed.
  const requirements = itemsWithIds.map((item) => ({
    id: item.id,
    type: item.type,
    text: item.text,
    supportingText: item.supportingText,
    section: assignments[item.id] ?? "General",
  }));

  return { requirements, totalShall, totalMust, summary };
}

// ── Step 2: Evaluate RFP ──────────────────────────────────────────────────────

async function executeEvaluateRFP(
  rfpDocuments: RFPDocument[],
  supplementaryDocument: RFPDocument | null,
  proposalType: string,
  retrievedContext: string,
  anthropicApiKey: string,
  claudeModel: string,
) {
  const supplementaryLabel = proposalType === "enterprise" ? "Resume" : "Capability Statement";

  const rfpContext = rfpDocuments
    .map((d, i) => `--- RFP Document ${i + 1}: ${d.name} ---\n${truncateDoc(d.content)}`)
    .join("\n\n");

  const supplementaryContext = supplementaryDocument
    ? `--- ${supplementaryLabel}: ${supplementaryDocument.name} ---\n${truncateDoc(supplementaryDocument.content)}`
    : "";

  const systemPrompt = `You are an expert proposal evaluator and RFP analyst. You evaluate how well an applicant's qualifications match a Request for Proposal (RFP).

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
  "summary": "<2-3 sentence executive summary of the match>"
}

Categories to evaluate (score each 0-100):
1. Technical Capability Match
2. Experience & Past Performance
3. Key Personnel Qualifications
4. Understanding of Requirements
5. Compliance with Mandatory Requirements
6. Competitive Positioning

Keep each strength, weakness, recommendation to 1 sentence.`;

  const userPrompt = `Evaluate the following RFP against the applicant's ${supplementaryLabel}.
${retrievedContext}
RFP / Reference Documents:
${rfpContext || "No RFP documents provided."}

Applicant's ${supplementaryLabel}:
${supplementaryContext || `No ${supplementaryLabel} provided.`}

Analyze how well the applicant's qualifications match the RFP requirements. Score each category 0-100, identify strengths and weaknesses, and provide actionable recommendations.`;

  const content = await callClaude(anthropicApiKey, claudeModel, [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ], "step2_evaluate");
  return extractJSON(content);
}

// ── Step 3: Recommend Tech Stack ──────────────────────────────────────────────

async function executeRecommendTechStack(
  rfpDocuments: RFPDocument[],
  supplementaryDocument: RFPDocument | null,
  proposalType: string,
  retrievedContext: string,
  anthropicApiKey: string,
  claudeModel: string,
) {
  const supplementaryLabel = proposalType === "enterprise" ? "Resume" : "Capability Statement";

  const rfpContext = rfpDocuments
    .map((d, i) => `--- RFP Document ${i + 1}: ${d.name} ---\n${truncateDoc(d.content)}`)
    .join("\n\n");

  const supplementaryContext = supplementaryDocument
    ? `--- ${supplementaryLabel}: ${supplementaryDocument.name} ---\n${truncateDoc(supplementaryDocument.content)}`
    : "";

  const systemPrompt = `You are a technical architect specializing in proposal analysis. Extract the technical skills and technology stack required by an RFP.

You MUST respond with valid JSON only. No markdown, no explanation outside the JSON.

Respond with this exact JSON structure:
{
  "technicalSkills": [
    { "skill": "<name>", "level": "required", "reason": "<brief reason, 10 words max>" }
  ],
  "techStack": [
    { "name": "<technology>", "category": "<Language|Framework|Cloud|Database|DevOps|Security|Integration|Other>", "required": true }
  ]
}

List up to 10 technicalSkills and up to 15 techStack items. Use "required" or "preferred" for skill level.`;

  const userPrompt = `Analyze the following RFP and identify the complete technical skills and technology stack required to fulfil it.
${retrievedContext}
RFP / Reference Documents:
${rfpContext || "No RFP documents provided."}

Applicant's ${supplementaryLabel}:
${supplementaryContext || `No ${supplementaryLabel} provided.`}

Extract all technical skills (programming languages, certifications, domain expertise) and technology stack items (frameworks, cloud services, databases, tools) explicitly or implicitly required by this RFP.`;

  const content = await callClaude(anthropicApiKey, claudeModel, [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ], "step3_techstack");
  return extractJSON(content);
}

// ── Step 4: Generate Solution ─────────────────────────────────────────────────

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
  const providerName = cloudProvider === "azure"
    ? "Microsoft Azure"
    : cloudProvider === "gcp"
    ? "Google Cloud Platform (GCP)"
    : "Amazon Web Services (AWS)";

  const providerConstraint = `IMPORTANT: The solution MUST use ${providerName} services exclusively. All components, services, and architecture elements should be from ${providerName}. Use the appropriate service names and colors for ${providerName}.`;

  const rfpContext = rfpDocuments?.length > 0
    ? rfpDocuments.map((d, i) => `--- RFP Document ${i + 1}: ${d.name} ---\n${truncateDoc(d.content)}`).join("\n\n")
    : "";

  const supplementaryLabel = proposalType === "enterprise" ? "Resume" : "Capability Statement";
  const supplementaryContext = supplementaryDocument
    ? `--- ${supplementaryLabel}: ${supplementaryDocument.name} ---\n${truncateDoc(supplementaryDocument.content)}`
    : "";

  const systemPrompt = `You are an expert solution architect. Given an RFP and evaluation results, generate a comprehensive technical solution and an architecture diagram.

${providerConstraint}

You MUST respond with valid JSON only. No markdown fences, no text outside the JSON.

Output this exact JSON structure:
{
  "solutionTitle": "<concise title for the proposed solution>",
  "solutionOverview": "<3-5 paragraph solution overview in markdown format>",
  "keyComponents": [
    {
      "name": "<component name>",
      "description": "<description using ${providerName} services>",
      "cloudProvider": "${cloudProvider}",
      "rfpQuotes": ["<exact quote from RFP>", "<exact quote from RFP>"]
    }
  ],
  "nodes": [
    {
      "id": "<unique id>",
      "label": "<service/component name>",
      "abbr": "<2-4 letter abbreviation>",
      "description": "<short description>",
      "x": <number>,
      "y": <number>,
      "color": "<hex color or tailwind bg class>",
      "textColor": "text-white"
    }
  ],
  "edges": [
    {
      "id": "<unique id>",
      "source": "<node id>",
      "target": "<node id>",
      "animated": <true|false>,
      "label": "<optional flow description>"
    }
  ]
}

Solution guidelines:
- Provide a clear, actionable solution overview (3-5 paragraphs)
- List key solution components with brief descriptions using ${providerName} services
- For EACH key component, extract 1-3 EXACT sentences or phrases from the RFP documents that justify or request that component. These must be direct quotes from the source documents, not paraphrased. Include them in the "rfpQuotes" array for each component.
- Include implementation approach and timeline considerations
- Reference specific RFP requirements being addressed
- All cloudProvider values in keyComponents MUST be "${cloudProvider}"

Architecture diagram guidelines:
- Generate 5-10 nodes representing the key components of the solution using ${providerName} services
- Use realistic ${providerName} service names (e.g. ${cloudProvider === "aws" ? "EC2, S3, Lambda, RDS, CloudFront, SQS, SNS, DynamoDB" : cloudProvider === "azure" ? "App Service, Blob Storage, Functions, SQL Database, Front Door, Service Bus, Cosmos DB" : "Compute Engine, Cloud Storage, Cloud Functions, Cloud SQL, Cloud CDN, Pub/Sub, Firestore"})
- Space nodes with ~220px horizontal gaps and ~130px vertical gaps to keep the diagram compact
- Connect nodes logically to show data/request flow
- Use animated: true for primary data flows

Cloud service colors for ${providerName}:
${cloudProvider === "aws" ? '- bg-[#FF9900] (compute), bg-[#3B48CC] (database), bg-[#E7157B] (analytics), bg-[#7B61FF] (ML/AI), bg-[#1A9C55] (storage), bg-[#DD344C] (security), bg-[#E7157B] (networking)' : cloudProvider === "azure" ? '- bg-[#0078D4] (compute), bg-[#50E6FF] (data), bg-[#00BCF2] (networking), bg-[#7FBA00] (DevOps), bg-[#FF8C00] (AI/ML), bg-[#E81123] (security), bg-[#68217A] (integration)' : '- bg-[#4285F4] (compute), bg-[#DB4437] (data), bg-[#F4B400] (ML/AI), bg-[#0F9D58] (networking), bg-[#185ABC] (security), bg-[#EA4335] (analytics), bg-[#34A853] (storage)'}
- bg-[#6366F1] (integration), bg-[#EC4899] (security fallback), bg-[#14B8A6] (monitoring)`;

  const userPrompt = `Based on the following RFP and evaluation, generate a detailed solution and architecture diagram.
${retrievedContext}
RFP / Reference Documents:
${rfpContext || "No RFP documents provided."}

${supplementaryContext ? `Applicant's ${supplementaryLabel}:\n${supplementaryContext}\n` : ""}

${evaluationSummary ? `Previous Evaluation Summary:\n${evaluationSummary}\n` : ""}

Generate a solution that addresses the RFP requirements with a practical architecture diagram showing the key components, services, and their interactions.`;

  const content = await callClaude(anthropicApiKey, claudeModel, [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ], "step3_solution");
  const parsed = extractJSON(content);
  if (!parsed.solutionTitle || !parsed.nodes || !parsed.edges) {
    throw new Error("AI did not return structured solution data");
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
    // Step 1 — use Haiku for simple section-assignment JSON (faster, less overloaded)
    const haikuModel = "claude-haiku-4-5-20251001";
    await sendEvent({ type: "tool_start", tool: "extract_requirements", message: `Processing ${preExtractedRequirements.length} pre-extracted SHALL & MUST requirements...` });
    const requirementsResult = await executeExtractRequirements(
      preExtractedRequirements, sectionHeadings, anthropicApiKey, haikuModel,
    );
    await sendEvent({ type: "tool_result", tool: "extract_requirements", data: requirementsResult });

    // Step 2
    await sendEvent({ type: "tool_start", tool: "evaluate_rfp", message: "Retrieving relevant context for fit evaluation..." });
    const evaluationContext = await queryRelevantChunks(
      "qualifications experience technical capability past performance evaluation",
      sessionId, pgUrl, azureEndpoint, azureApiKey, embeddingDeployment, apiVersion,
    );

    await sendEvent({ type: "tool_start", tool: "evaluate_rfp", message: "Evaluating fit against your qualifications..." });
    const evaluationResult = await executeEvaluateRFP(
      rfpDocuments, supplementaryDocument, proposalType, evaluationContext, anthropicApiKey, claudeModel,
    );
    await sendEvent({ type: "tool_result", tool: "evaluate_rfp", data: evaluationResult });

    // Step 3 — Tech Stack Recommendation
    await sendEvent({ type: "tool_start", tool: "recommend_tech_stack", message: "Retrieving relevant context for tech stack analysis..." });
    const techStackContext = await queryRelevantChunks(
      "technology requirements technical stack programming languages frameworks tools cloud services security",
      sessionId, pgUrl, azureEndpoint, azureApiKey, embeddingDeployment, apiVersion,
    );

    await sendEvent({ type: "tool_start", tool: "recommend_tech_stack", message: "Identifying required technical skills and tech stack..." });
    const techStackResult = await executeRecommendTechStack(
      rfpDocuments, supplementaryDocument, proposalType, techStackContext, anthropicApiKey, claudeModel,
    );
    await sendEvent({ type: "tool_result", tool: "recommend_tech_stack", data: techStackResult });

    // Step 4 — Architecture Diagram
    await sendEvent({ type: "tool_start", tool: "generate_solution", message: "Retrieving relevant context for solution architecture..." });
    const solutionContext = await queryRelevantChunks(
      "solution architecture technical approach implementation services cloud infrastructure",
      sessionId, pgUrl, azureEndpoint, azureApiKey, embeddingDeployment, apiVersion,
    );

    await sendEvent({ type: "tool_start", tool: "generate_solution", message: "Generating architecture solution and diagram..." });
    const evaluationSummary = `Score: ${evaluationResult.overallScore}/100. ${evaluationResult.summary}`;
    const solutionResult = await executeGenerateSolution(
      rfpDocuments, supplementaryDocument, proposalType, evaluationSummary, cloudProvider, solutionContext, anthropicApiKey, claudeModel,
    );
    await sendEvent({ type: "tool_result", tool: "generate_solution", data: solutionResult });

    await sendEvent({ type: "agent_done", message: "All steps complete. Your proposal evaluation is ready." });
  } catch (err) {
    await sendEvent({ type: "agent_error", message: err instanceof Error ? err.message : "Unknown error" });
  } finally {
    await writer.close();
  }
}

// ── Main Handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rfpDocuments, supplementaryDocument, proposalType, cloudProvider, sessionId, preExtractedRequirements, sectionHeadings } =
      await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
    const CLAUDE_MODEL = Deno.env.get("CLAUDE_MODEL") ?? "claude-sonnet-4-6";
    // Azure is still used for embeddings (pgvector retrieval)
    const AZURE_OPENAI_ENDPOINT = (Deno.env.get("AZURE_OPENAI_ENDPOINT") ?? "").replace(/\/+$/, "");
    const AZURE_OPENAI_API_KEY = Deno.env.get("AZURE_OPENAI_API_KEY") ?? "";
    const AZURE_OPENAI_EMBEDDING_DEPLOYMENT = Deno.env.get("AZURE_OPENAI_EMBEDDING_DEPLOYMENT") ?? "text-embedding-ada-002";
    const AZURE_OPENAI_API_VERSION = Deno.env.get("AZURE_OPENAI_API_VERSION") ?? "2024-08-01-preview";
    const AZURE_POSTGRES_URL = Deno.env.get("AZURE_POSTGRES_URL") ?? "";

    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!rfpDocuments || rfpDocuments.length === 0) {
      return new Response(JSON.stringify({ error: "No RFP documents provided." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const sendEvent = async (payload: object) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
    };

    // Fire-and-forget so we return the stream immediately
    runAgent(
      sendEvent, writer,
      rfpDocuments, supplementaryDocument,
      proposalType, cloudProvider ?? "aws",
      sessionId ?? "",
      ANTHROPIC_API_KEY, CLAUDE_MODEL,
      AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY,
      AZURE_OPENAI_EMBEDDING_DEPLOYMENT, AZURE_OPENAI_API_VERSION,
      AZURE_POSTGRES_URL,
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
    console.error("proposal-agent error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
