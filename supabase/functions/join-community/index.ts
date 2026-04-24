// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { communityId, fullName, email } = await req.json();

    if (!communityId) return json({ error: "communityId is required" }, 400);
    if (!fullName?.trim()) return json({ error: "Full name is required" }, 400);
    if (!email?.trim()) return json({ error: "Email address is required" }, 400);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return json({ error: "Invalid email address" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Verify community exists
    const { data: community, error: communityErr } = await supabase
      .from("courses")
      .select("id, title")
      .eq("id", communityId)
      .single();

    if (communityErr || !community) {
      return json({ error: "Community not found" }, 404);
    }

    // Upsert member (idempotent — same email can re-register without error)
    const { error: insertErr } = await supabase
      .from("community_members")
      .upsert(
        { community_id: communityId, full_name: fullName.trim(), email: email.trim().toLowerCase() },
        { onConflict: "community_id,email", ignoreDuplicates: false },
      );

    if (insertErr) {
      return json({ error: insertErr.message }, 500);
    }

    return json({ success: true, communityName: community.title });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
