import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type RFPDocument = { name: string; content: string };

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

async function callAzureOpenAI(azureEndpoint: string, apiKey: string, chatDeployment: string, apiVersion: string, messages: object[], tools?: object[], toolChoice?: object): Promise<any> {
  const url = `${azureEndpoint}/openai/deployments/${chatDeployment}/chat/completions?api-version=${apiVersion}`;
  const body: any = { messages };
  if (tools) { body.tools = tools; body.tool_choice = toolChoice; }
  const response = await fetch(url, {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const status = response.status;
    if (status === 429) throw new Error("Rate limit exceeded. Please try again.");
    if (status === 402) throw new Error("Azure OpenAI usage limit reached.");
    throw new Error(`Azure OpenAI error (status ${status})`);
  }
  return response.json();
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
  azureEndpoint: string,
  apiKey: string,
  chatDeployment: string,
  apiVersion: string,
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

  const data = await callAzureOpenAI(azureEndpoint, apiKey, chatDeployment, apiVersion, [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  const raw = data.choices?.[0]?.message?.content || "";
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, raw];

  let assignments: Record<string, string> = {};
  let summary = `Found ${totalShall} shall and ${totalMust} must requirements.`;
  try {
    const parsed = JSON.parse(jsonMatch[1].trim());
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
  azureEndpoint: string,
  apiKey: string,
  chatDeployment: string,
  apiVersion: string,
) {
  const supplementaryLabel = proposalType === "enterprise" ? "Resume" : "Capability Statement";

  const rfpContext = rfpDocuments
    .map((d, i) => `--- RFP Document ${i + 1}: ${d.name} ---\n${d.content}`)
    .join("\n\n");

  const supplementaryContext = supplementaryDocument
    ? `--- ${supplementaryLabel}: ${supplementaryDocument.name} ---\n${supplementaryDocument.content}`
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

Be thorough, specific, and reference actual content from the documents. Each strength, weakness, and recommendation should be a detailed sentence.`;

  const userPrompt = `Evaluate the following RFP against the applicant's ${supplementaryLabel}.
${retrievedContext}
RFP / Reference Documents:
${rfpContext || "No RFP documents provided."}

Applicant's ${supplementaryLabel}:
${supplementaryContext || `No ${supplementaryLabel} provided.`}

Analyze how well the applicant's qualifications match the RFP requirements. Score on a scale of 0-100 and provide detailed strengths, weaknesses, and actionable recommendations.`;

  const data = await callAzureOpenAI(azureEndpoint, apiKey, chatDeployment, apiVersion, [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);
  const content = data.choices?.[0]?.message?.content || "";
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
  return JSON.parse(jsonMatch[1].trim());
}

// ── Step 3: Generate Solution ─────────────────────────────────────────────────

async function executeGenerateSolution(
  rfpDocuments: RFPDocument[],
  supplementaryDocument: RFPDocument | null,
  proposalType: string,
  evaluationSummary: string,
  cloudProvider: string,
  retrievedContext: string,
  azureEndpoint: string,
  apiKey: string,
  chatDeployment: string,
  apiVersion: string,
) {
  const providerName = cloudProvider === "azure"
    ? "Microsoft Azure"
    : cloudProvider === "gcp"
    ? "Google Cloud Platform (GCP)"
    : "Amazon Web Services (AWS)";

  const providerConstraint = `IMPORTANT: The solution MUST use ${providerName} services exclusively. All components, services, and architecture elements should be from ${providerName}. Use the appropriate service names and colors for ${providerName}.`;

  const rfpContext = rfpDocuments?.length > 0
    ? rfpDocuments.map((d, i) => `--- RFP Document ${i + 1}: ${d.name} ---\n${d.content}`).join("\n\n")
    : "";

  const supplementaryLabel = proposalType === "enterprise" ? "Resume" : "Capability Statement";
  const supplementaryContext = supplementaryDocument
    ? `--- ${supplementaryLabel}: ${supplementaryDocument.name} ---\n${supplementaryDocument.content}`
    : "";

  const systemPrompt = `You are an expert solution architect. Given an RFP and evaluation results, generate a comprehensive technical solution and an architecture diagram.

${providerConstraint}

You MUST respond by calling the generate_solution tool. Do not respond with plain text.

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
- Each node needs: id, label (service/component name), abbr (2-4 letter abbreviation), description (short), x (position), y (position), color (hex color), textColor (always "text-white")
- Space nodes with ~300px horizontal gaps and ~180px vertical gaps
- Connect nodes logically to show data/request flow
- Each edge needs: id, source (node id), target (node id), animated (boolean), label (optional flow description)
- Use animated edges for primary data flows

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

  const data = await callAzureOpenAI(azureEndpoint, apiKey, chatDeployment, apiVersion, [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ], [
        {
          type: "function",
          function: {
            name: "generate_solution",
            description: "Generate a solution description and architecture diagram for the RFP",
            parameters: {
              type: "object",
              properties: {
                solutionTitle: { type: "string", description: "A concise title for the proposed solution" },
                solutionOverview: { type: "string", description: "3-5 paragraph solution overview in markdown format" },
                keyComponents: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      cloudProvider: { type: "string", description: "aws, azure, gcp, or generic" },
                      rfpQuotes: {
                        type: "array",
                        items: { type: "string" },
                        description: "1-3 exact sentences or phrases extracted verbatim from the RFP documents that justify or request this component",
                      },
                    },
                    required: ["name", "description", "cloudProvider", "rfpQuotes"],
                    additionalProperties: false,
                  },
                },
                nodes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      label: { type: "string" },
                      abbr: { type: "string" },
                      description: { type: "string" },
                      x: { type: "number" },
                      y: { type: "number" },
                      color: { type: "string" },
                      textColor: { type: "string" },
                    },
                    required: ["id", "label", "abbr", "description", "x", "y", "color", "textColor"],
                    additionalProperties: false,
                  },
                },
                edges: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      source: { type: "string" },
                      target: { type: "string" },
                      animated: { type: "boolean" },
                      label: { type: "string" },
                    },
                    required: ["id", "source", "target", "animated"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["solutionTitle", "solutionOverview", "keyComponents", "nodes", "edges"],
              additionalProperties: false,
            },
          },
        },
  ], { type: "function", function: { name: "generate_solution" } });
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("AI did not return structured solution data");
  return JSON.parse(toolCall.function.arguments);
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
  azureEndpoint: string,
  apiKey: string,
  chatDeployment: string,
  embeddingDeployment: string,
  apiVersion: string,
  pgUrl: string,
  preExtractedRequirements: PreExtractedItem[],
  sectionHeadings: string[],
) {
  try {
    // Step 1
    await sendEvent({ type: "tool_start", tool: "extract_requirements", message: `Processing ${preExtractedRequirements.length} pre-extracted SHALL & MUST requirements...` });
    const requirementsResult = await executeExtractRequirements(
      preExtractedRequirements, sectionHeadings, azureEndpoint, apiKey, chatDeployment, apiVersion,
    );
    await sendEvent({ type: "tool_result", tool: "extract_requirements", data: requirementsResult });

    // Step 2
    await sendEvent({ type: "tool_start", tool: "evaluate_rfp", message: "Retrieving relevant context for fit evaluation..." });
    const evaluationContext = await queryRelevantChunks(
      "qualifications experience technical capability past performance evaluation",
      sessionId, pgUrl, azureEndpoint, apiKey, embeddingDeployment, apiVersion,
    );

    await sendEvent({ type: "tool_start", tool: "evaluate_rfp", message: "Evaluating fit against your qualifications..." });
    const evaluationResult = await executeEvaluateRFP(
      rfpDocuments, supplementaryDocument, proposalType, evaluationContext, azureEndpoint, apiKey, chatDeployment, apiVersion,
    );
    await sendEvent({ type: "tool_result", tool: "evaluate_rfp", data: evaluationResult });

    // Step 3
    await sendEvent({ type: "tool_start", tool: "generate_solution", message: "Retrieving relevant context for solution architecture..." });
    const solutionContext = await queryRelevantChunks(
      "solution architecture technical approach implementation services cloud infrastructure",
      sessionId, pgUrl, azureEndpoint, apiKey, embeddingDeployment, apiVersion,
    );

    await sendEvent({ type: "tool_start", tool: "generate_solution", message: "Generating architecture solution and diagram..." });
    const evaluationSummary = `Score: ${evaluationResult.overallScore}/100. ${evaluationResult.summary}`;
    const solutionResult = await executeGenerateSolution(
      rfpDocuments, supplementaryDocument, proposalType, evaluationSummary, cloudProvider, solutionContext, azureEndpoint, apiKey, chatDeployment, apiVersion,
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

    const AZURE_OPENAI_ENDPOINT = Deno.env.get("AZURE_OPENAI_ENDPOINT") ?? "";
    const AZURE_OPENAI_API_KEY = Deno.env.get("AZURE_OPENAI_API_KEY") ?? "";
    const AZURE_OPENAI_CHAT_DEPLOYMENT = Deno.env.get("AZURE_OPENAI_CHAT_DEPLOYMENT") ?? "gpt-4o";
    const AZURE_OPENAI_EMBEDDING_DEPLOYMENT = Deno.env.get("AZURE_OPENAI_EMBEDDING_DEPLOYMENT") ?? "text-embedding-3-small";
    const AZURE_OPENAI_API_VERSION = Deno.env.get("AZURE_OPENAI_API_VERSION") ?? "2024-08-01-preview";
    const AZURE_POSTGRES_URL = Deno.env.get("AZURE_POSTGRES_URL") ?? "";

    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY are not configured" }), {
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
      AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY,
      AZURE_OPENAI_CHAT_DEPLOYMENT, AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
      AZURE_OPENAI_API_VERSION, AZURE_POSTGRES_URL,
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
