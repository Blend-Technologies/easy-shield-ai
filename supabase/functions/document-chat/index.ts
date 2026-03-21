// @ts-nocheck — Deno edge function: VS Code TS checker doesn't understand Deno globals.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Message = { role: "user" | "assistant"; content: string };

async function generateEmbedding(
  text: string,
  azureEndpoint: string,
  apiKey: string,
  embeddingDeployment: string,
  apiVersion: string,
): Promise<number[]> {
  const url = `${azureEndpoint}/openai/deployments/${embeddingDeployment}/embeddings?api-version=${apiVersion}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ input: text.slice(0, 8000) }),
  });
  if (!response.ok) throw new Error(`Embedding error (${response.status})`);
  const data = await response.json();
  return data.data[0].embedding as number[];
}

async function retrieveContext(
  question: string,
  sessionId: string,
  pgUrl: string,
  azureEndpoint: string,
  apiKey: string,
  embeddingDeployment: string,
  apiVersion: string,
  topK = 6,
): Promise<string> {
  if (!sessionId || !pgUrl) return "";
  const client = new Client(pgUrl);
  await client.connect();
  try {
    const embedding = await generateEmbedding(question, azureEndpoint, apiKey, embeddingDeployment, apiVersion);
    const embStr = `[${embedding.join(",")}]`;
    const result = await client.queryObject<{ content: string; document_name: string }>(
      `SELECT content, document_name FROM document_chunks
       WHERE session_id = $1 ORDER BY embedding <=> $2::vector LIMIT $3`,
      [sessionId, embStr, topK],
    );
    if (result.rows.length === 0) return "";
    return result.rows
      .map((r) => `[${r.document_name}]\n${r.content}`)
      .join("\n\n---\n\n");
  } catch (e) {
    console.warn("pgvector retrieval failed:", e);
    return "";
  } finally {
    await client.end();
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question, sessionId, history } = await req.json() as {
      question: string;
      sessionId: string;
      history: Message[];
    };

    if (!question?.trim()) {
      return new Response(JSON.stringify({ error: "Question is required." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const AZURE_OPENAI_ENDPOINT = (Deno.env.get("AZURE_OPENAI_ENDPOINT") ?? "").replace(/\/+$/, "");
    const AZURE_OPENAI_API_KEY = Deno.env.get("AZURE_OPENAI_API_KEY") ?? "";
    const AZURE_OPENAI_CHAT_DEPLOYMENT = Deno.env.get("AZURE_OPENAI_CHAT_DEPLOYMENT") ?? "gpt-4o";
    const AZURE_OPENAI_EMBEDDING_DEPLOYMENT = Deno.env.get("AZURE_OPENAI_EMBEDDING_DEPLOYMENT") ?? "text-embedding-ada-002";
    const AZURE_OPENAI_API_VERSION = Deno.env.get("AZURE_OPENAI_API_VERSION") ?? "2024-08-01-preview";
    const AZURE_POSTGRES_URL = Deno.env.get("AZURE_POSTGRES_URL") ?? "";

    // Retrieve relevant chunks from pgvector
    const context = await retrieveContext(
      question, sessionId, AZURE_POSTGRES_URL,
      AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY,
      AZURE_OPENAI_EMBEDDING_DEPLOYMENT, AZURE_OPENAI_API_VERSION,
    );

    const systemPrompt = `You are a helpful AI assistant that answers questions about uploaded RFP and capability documents.
${context ? `\nThe following excerpts were retrieved from the uploaded documents to help answer the question:\n\n${context}\n\nAnswer based on these excerpts. If the answer is not in the documents, say so clearly.` : "\nNo document context was retrieved. Answer based on your general knowledge and note that you could not find specific information in the uploaded documents."}

Guidelines:
- Be concise and direct. Use bullet points for lists.
- Quote or reference specific parts of the documents when relevant.
- If asked about requirements, refer to the specific section or clause.
- Do not fabricate information not present in the documents.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...((history ?? []).slice(-6)), // keep last 6 turns for context
      { role: "user", content: question },
    ];

    // Stream the response
    const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_CHAT_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;
    const azureResp = await fetch(url, {
      method: "POST",
      headers: { "api-key": AZURE_OPENAI_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ messages, stream: true, max_tokens: 1024 }),
    });

    if (!azureResp.ok) {
      throw new Error(`Azure OpenAI error (${azureResp.status})`);
    }

    // Pipe the Azure SSE stream directly to the client, re-emitting only text tokens
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const reader = azureResp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n");
          buf = parts.pop() ?? "";
          for (const line of parts) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content ?? "";
              if (token) {
                await writer.write(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
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
