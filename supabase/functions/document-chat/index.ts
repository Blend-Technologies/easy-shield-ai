// @ts-nocheck — Deno edge function: VS Code TS checker doesn't understand Deno globals.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Message = { role: "user" | "assistant"; content: string };
type DocumentInput = { name: string; content: string };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question, history, documents } = await req.json() as {
      question: string;
      history?: Message[];
      documents?: DocumentInput[];
    };

    if (!question?.trim()) {
      return new Response(JSON.stringify({ error: "Question is required." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY secret is not configured");

    // Build document context string (cap each doc at 12 000 chars to stay within token budget)
    const docContext = (documents ?? [])
      .filter((d) => d.content?.trim())
      .map((d) => `=== ${d.name} ===\n${d.content.slice(0, 12_000)}`)
      .join("\n\n");

    const systemPrompt = docContext
      ? `You are a helpful AI assistant that answers questions about uploaded RFP and capability documents.

The following documents have been provided:

${docContext}

Guidelines:
- Answer based on the document content above. Quote or reference specific sections when relevant.
- If the answer is not in the documents, say so clearly.
- Be concise. Use bullet points for lists.
- Do not fabricate information not present in the documents.`
      : `You are a helpful AI assistant that answers questions about RFP and proposal documents.
No documents were provided with this request. Ask the user to upload documents first, or answer based on general knowledge while noting that no documents are available.`;

    // Build messages array: history + current question (no system role in messages[])
    const chatMessages: { role: string; content: string }[] = [
      ...((history ?? []).slice(-6).filter((m) => m.role === "user" || m.role === "assistant")),
      { role: "user", content: question },
    ];

    // Call Anthropic Claude with streaming
    const anthropicResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: systemPrompt,
        messages: chatMessages,
        stream: true,
      }),
    });

    if (!anthropicResp.ok) {
      const errBody = await anthropicResp.text();
      throw new Error(`Anthropic error (${anthropicResp.status}): ${errBody.slice(0, 300)}`);
    }

    // Transform Anthropic SSE stream → frontend token stream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
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
              // Anthropic streaming: content_block_delta carries the text
              if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
                const token = parsed.delta.text ?? "";
                if (token) {
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
                }
              }
            } catch { /* skip malformed chunks */ }
          }
        }
      } finally {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    console.error("document-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
