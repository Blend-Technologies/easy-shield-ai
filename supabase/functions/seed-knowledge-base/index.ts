// @ts-nocheck — Deno edge function: VS Code TS checker doesn't understand Deno globals.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Chunking ──────────────────────────────────────────────────────────────────
function chunkText(text: string, chunkSize = 1500, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    if (end === text.length) break;
    start = end - overlap;
  }
  return chunks.filter((c) => c.length > 50);
}

// ── Azure OpenAI embedding ────────────────────────────────────────────────────
async function generateEmbedding(
  text: string,
  endpoint: string,
  apiKey: string,
  deployment: string,
  apiVersion: string,
): Promise<number[]> {
  const url = `${endpoint}/openai/deployments/${deployment}/embeddings?api-version=${apiVersion}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ input: text.slice(0, 8000) }),
  });
  if (!resp.ok) throw new Error(`Azure embedding error (${resp.status}): ${await resp.text()}`);
  const data = await resp.json();
  return data.data[0].embedding as number[];
}

// ── Main Handler ──────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { documents, category = "style_template", clearExisting = false } = await req.json() as {
      documents: Array<{ name: string; content: string }>;
      category?: string;
      clearExisting?: boolean;
    };

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ error: "No documents provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const AZURE_OPENAI_ENDPOINT      = (Deno.env.get("AZURE_OPENAI_ENDPOINT") ?? "").replace(/\/+$/, "");
    const AZURE_OPENAI_API_KEY       = Deno.env.get("AZURE_OPENAI_API_KEY") ?? "";
    const AZURE_EMBEDDING_DEPLOYMENT = Deno.env.get("AZURE_OPENAI_EMBEDDING_DEPLOYMENT") ?? "text-embedding-ada-002";
    const AZURE_API_VERSION          = Deno.env.get("AZURE_OPENAI_API_VERSION") ?? "2024-08-01-preview";
    const AZURE_POSTGRES_URL         = Deno.env.get("AZURE_POSTGRES_URL") ?? "";

    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY) {
      throw new Error("Azure OpenAI credentials not configured.");
    }
    if (!AZURE_POSTGRES_URL) {
      throw new Error("AZURE_POSTGRES_URL not configured.");
    }

    const client = new Client(AZURE_POSTGRES_URL);
    await client.connect();

    try {
      // Optionally clear existing entries for this category
      if (clearExisting) {
        await client.queryObject(
          `DELETE FROM knowledge_base_chunks WHERE category = $1`,
          [category],
        );
        console.log(`Cleared existing chunks for category: ${category}`);
      }

      let totalChunks = 0;

      for (const doc of documents) {
        const chunks = chunkText(doc.content);
        console.log(`Document "${doc.name}": ${chunks.length} chunks`);

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const embedding = await generateEmbedding(
            chunk, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY,
            AZURE_EMBEDDING_DEPLOYMENT, AZURE_API_VERSION,
          );
          const embeddingStr = `[${embedding.join(",")}]`;

          await client.queryObject(
            `INSERT INTO knowledge_base_chunks (document_name, category, content, chunk_index, embedding)
             VALUES ($1, $2, $3, $4, $5::vector)`,
            [doc.name, category, chunk, i, embeddingStr],
          );
          totalChunks++;
        }
      }

      console.log(`Seeded ${totalChunks} chunks for category "${category}".`);
      return new Response(
        JSON.stringify({ success: true, totalChunks, category, documentsSeeded: documents.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } finally {
      await client.end();
    }
  } catch (e) {
    console.error("seed-knowledge-base error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
