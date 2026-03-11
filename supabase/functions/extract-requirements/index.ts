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
    const { rfpDocuments, followUpQuestion, previousRequirements } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const rfpContext = rfpDocuments && rfpDocuments.length > 0
      ? rfpDocuments.map((d: { name: string; content: string }, i: number) => `--- Document ${i + 1}: ${d.name} ---\n${d.content}`).join("\n\n")
      : "";

    if (!rfpContext) {
      return new Response(JSON.stringify({ error: "No RFP documents provided." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert RFP analyst. Your task is to extract all "shall" and "must" requirements from the provided documents.

You MUST respond with valid JSON only. No markdown, no explanation outside the JSON.

Respond with this exact JSON structure:
{
  "requirements": [
    {
      "id": "<sequential number like R-001>",
      "type": "shall" | "must",
      "text": "<the full requirement text>",
      "section": "<ONLY use a heading or section title that appears VERBATIM in the document. If no clear heading is identifiable, use 'General'. Do NOT invent section numbers, page numbers, or headings that are not explicitly present in the text.>"
    }
  ],
  "totalShall": <count of shall requirements>,
  "totalMust": <count of must requirements>,
  "summary": "<1-2 sentence summary of the key mandatory requirements>"
}

Be thorough. Extract every instance where the document uses "shall" or "must" to define a mandatory requirement. Include the full sentence or clause containing the requirement.`;

    let userPrompt: string;

    if (followUpQuestion && previousRequirements) {
      // Follow-up mode: refine based on previous results and user question
      const prevReqsJson = JSON.stringify(previousRequirements, null, 2);
      userPrompt = `Here are the previously extracted requirements from the RFP documents:\n\n${prevReqsJson}\n\nOriginal RFP Documents:\n${rfpContext}\n\nThe user has a follow-up question/instruction: "${followUpQuestion}"\n\nPlease update the requirements list based on the user's question. You may add, remove, refine, filter, or re-categorize requirements as needed. Return the full updated requirements list in the same JSON format.`;
    } else {
      userPrompt = `Write out a list of shall and Must from this document:\n\n${rfpContext}`;
    }

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

    let parsed;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      parsed = JSON.parse(jsonMatch[1].trim());
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse requirements" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-requirements error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
