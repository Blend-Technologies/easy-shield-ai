import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rfpDocuments, supplementaryDocument, proposalType, evaluationSummary, cloudProvider } = await req.json();

    const providerName = cloudProvider === "azure" ? "Microsoft Azure" : cloudProvider === "gcp" ? "Google Cloud Platform (GCP)" : "Amazon Web Services (AWS)";
    const providerConstraint = `IMPORTANT: The solution MUST use ${providerName} services exclusively. All components, services, and architecture elements should be from ${providerName}. Use the appropriate service names and colors for ${providerName}.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const rfpContext = rfpDocuments?.length > 0
      ? rfpDocuments.map((d: { name: string; content: string }, i: number) => `--- RFP Document ${i + 1}: ${d.name} ---\n${d.content}`).join("\n\n")
      : "";

    const supplementaryLabel = proposalType === "enterprise" ? "Resume" : "Capability Statement";
    const supplementaryContext = supplementaryDocument
      ? `--- ${supplementaryLabel}: ${supplementaryDocument.name} ---\n${supplementaryDocument.content}`
      : "";

    const systemPrompt = `You are an expert solution architect. Given an RFP and evaluation results, generate a comprehensive technical solution and an architecture diagram.

You MUST respond by calling the generate_solution tool. Do not respond with plain text.

Solution guidelines:
- Provide a clear, actionable solution overview (3-5 paragraphs)
- List key solution components with brief descriptions
- Include implementation approach and timeline considerations
- Reference specific RFP requirements being addressed

Architecture diagram guidelines:
- Generate 5-10 nodes representing the key components of the solution
- Use realistic cloud service names from AWS, Azure, or GCP as appropriate
- Each node needs: id, label (service/component name), abbr (2-4 letter abbreviation), description (short), x (position), y (position), color (hex color like "bg-[#FF9900]" for AWS, "bg-[#0078D4]" for Azure, "bg-[#4285F4]" for Google Cloud), textColor (always "text-white")
- Space nodes with ~300px horizontal gaps and ~180px vertical gaps
- Connect nodes logically to show data/request flow
- Each edge needs: id, source (node id), target (node id), animated (boolean), label (optional flow description)
- Use animated edges for primary data flows

Common cloud service colors:
- AWS: bg-[#FF9900] (compute), bg-[#3B48CC] (database), bg-[#E7157B] (analytics), bg-[#7B61FF] (ML/AI), bg-[#1A9C55] (storage)
- Azure: bg-[#0078D4] (compute), bg-[#50E6FF] (data), bg-[#00BCF2] (networking), bg-[#7FBA00] (DevOps)
- GCP: bg-[#4285F4] (compute), bg-[#DB4437] (data), bg-[#F4B400] (ML), bg-[#0F9D58] (networking)
- Generic: bg-[#6366F1] (integration), bg-[#EC4899] (security), bg-[#14B8A6] (monitoring)`;

    const userPrompt = `Based on the following RFP and evaluation, generate a detailed solution and architecture diagram.

RFP / Reference Documents:
${rfpContext || "No RFP documents provided."}

${supplementaryContext ? `Applicant's ${supplementaryLabel}:\n${supplementaryContext}\n` : ""}

${evaluationSummary ? `Previous Evaluation Summary:\n${evaluationSummary}\n` : ""}

Generate a solution that addresses the RFP requirements with a practical architecture diagram showing the key components, services, and their interactions.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
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
                      },
                      required: ["name", "description", "cloudProvider"],
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
        ],
        tool_choice: { type: "function", function: { name: "generate_solution" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "AI did not return structured solution data" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const solution = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(solution), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-solution error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
