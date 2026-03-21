// @ts-nocheck — Deno edge function: VS Code TS checker doesn't understand Deno globals.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type DocumentInput = { name: string; content: string };

function chunkText(text: string, chunkSize = 1500, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 50) chunks.push(chunk);
    if (end === text.length) break;
    start += chunkSize - overlap;
  }
  return chunks;
}

async function generateEmbedding(text: string, azureEndpoint: string, apiKey: string, deploymentName: string, apiVersion: string): Promise<number[]> {
  const url = `${azureEndpoint}/openai/deployments/${deploymentName}/embeddings?api-version=${apiVersion}`;
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
    const body = await response.text();
    throw new Error(`Azure OpenAI embedding error (${response.status}): ${body}`);
  }
  const data = await response.json();
  return data.data[0].embedding as number[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, documents } = await req.json() as {
      sessionId: string;
      documents: DocumentInput[];
    };

    const AZURE_POSTGRES_URL = Deno.env.get("AZURE_POSTGRES_URL");
    const AZURE_OPENAI_ENDPOINT = (Deno.env.get("AZURE_OPENAI_ENDPOINT") ?? "").replace(/\/+$/, "");
    const AZURE_OPENAI_API_KEY = Deno.env.get("AZURE_OPENAI_API_KEY");
    const AZURE_OPENAI_EMBEDDING_DEPLOYMENT = Deno.env.get("AZURE_OPENAI_EMBEDDING_DEPLOYMENT") ?? "text-embedding-ada-002";
    const AZURE_OPENAI_API_VERSION = Deno.env.get("AZURE_OPENAI_API_VERSION") ?? "2024-08-01-preview";

    if (!AZURE_POSTGRES_URL) throw new Error("AZURE_POSTGRES_URL secret is not configured");
    if (!AZURE_OPENAI_ENDPOINT) throw new Error("AZURE_OPENAI_ENDPOINT secret is not configured");
    if (!AZURE_OPENAI_API_KEY) throw new Error("AZURE_OPENAI_API_KEY secret is not configured");
    if (!sessionId) throw new Error("sessionId is required");
    if (!documents || documents.length === 0) throw new Error("No documents provided");

    const client = new Client(AZURE_POSTGRES_URL);
    await client.connect();

    try {
      // Clear existing chunks for this session so re-uploads are clean
      await client.queryArray(
        `DELETE FROM document_chunks WHERE session_id = $1`,
        [sessionId],
      );

      let totalChunks = 0;

      for (const doc of documents) {
        const chunks = chunkText(doc.content);
        for (let i = 0; i < chunks.length; i++) {
          const embedding = await generateEmbedding(chunks[i], AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_EMBEDDING_DEPLOYMENT, AZURE_OPENAI_API_VERSION);
          const embeddingStr = `[${embedding.join(",")}]`;
          await client.queryArray(
            `INSERT INTO document_chunks
               (session_id, document_name, content, chunk_index, embedding)
             VALUES ($1, $2, $3, $4, $5::vector)`,
            [sessionId, doc.name, chunks[i], i, embeddingStr],
          );
          totalChunks++;
        }
      }

      return new Response(
        JSON.stringify({ success: true, totalChunks }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } finally {
      await client.end();
    }
  } catch (e) {
    console.error("index-documents error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
