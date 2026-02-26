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
    const { prompt, imageDataUrls } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userContent: any[] = [];

    // Add text prompt
    userContent.push({
      type: "text",
      text: prompt || "Generate a cloud architecture diagram with common services.",
    });

    // Add images if provided
    if (imageDataUrls && imageDataUrls.length > 0) {
      for (const dataUrl of imageDataUrls) {
        userContent.push({
          type: "image_url",
          image_url: { url: dataUrl },
        });
      }
    }

    const systemPrompt = `You are an expert cloud architecture diagram generator. Given a user's description (and optionally reference images), generate a list of nodes and edges for a React Flow diagram.

You MUST respond by calling the generate_diagram tool. Do not respond with plain text.

Node guidelines:
- Each node needs: id (string), label (service name), abbr (2-4 letter abbreviation), description (short), position (x,y coordinates), color (a Tailwind bg color like "bg-[#FF9900]"), textColor (always "text-white")
- Space nodes horizontally with ~300px gaps and vertically with ~150px gaps
- Use realistic cloud service names (AWS, Azure, GCP, or generic)
- Assign appropriate brand colors to each service

Edge guidelines:
- Connect nodes logically to show data/request flow
- Each edge needs: id, source (node id), target (node id), animated (boolean)
- Use animated edges for primary data flows

Generate 4-8 nodes and appropriate edges to represent the architecture described.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_diagram",
                description:
                  "Generate nodes and edges for a cloud architecture diagram",
                parameters: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      description: "A descriptive title for the diagram",
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
                        required: [
                          "id",
                          "label",
                          "abbr",
                          "description",
                          "x",
                          "y",
                          "color",
                          "textColor",
                        ],
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
                        },
                        required: ["id", "source", "target", "animated"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["title", "nodes", "edges"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "generate_diagram" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "AI did not return structured diagram data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const diagram = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(diagram), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-diagram error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
