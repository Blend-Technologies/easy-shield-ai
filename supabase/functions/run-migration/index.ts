// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_DB_URL = Deno.env.get("SUPABASE_DB_URL") ?? "";
  if (!SUPABASE_DB_URL) {
    return new Response(JSON.stringify({ error: "SUPABASE_DB_URL not set" }), { status: 500, headers: corsHeaders });
  }

  const client = new Client(SUPABASE_DB_URL);
  await client.connect();
  try {
    await client.queryObject(`ALTER TABLE spark_projects ADD COLUMN IF NOT EXISTS due_date date`);
    return new Response(JSON.stringify({ success: true, message: "due_date column added to spark_projects" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } finally {
    await client.end();
  }
});
