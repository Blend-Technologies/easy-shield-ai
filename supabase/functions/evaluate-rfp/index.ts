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
    const { rfpDocuments, supplementaryDocument, proposalType } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supplementaryLabel = proposalType === "enterprise" ? "Resume" : "Capability Statement";

    const rfpContext = rfpDocuments && rfpDocuments.length > 0
      ? rfpDocuments.map((d: { name: string; content: string }, i: number) => `--- RFP Document ${i + 1}: ${d.name} ---\n${d.content}`).join("\n\n")
      : "";

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

RFP / Reference Documents:
${rfpContext || "No RFP documents provided."}

Applicant's ${supplementaryLabel}:
${supplementaryContext || `No ${supplementaryLabel} provided.`}

Analyze how well the applicant's qualifications match the RFP requirements. Score on a scale of 0-100 and provide detailed strengths, weaknesses, and actionable recommendations.`;

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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle markdown code blocks)
    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1].trim());
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse evaluation results" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("evaluate-rfp error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
