import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const siteUrl = Deno.env.get("SITE_URL") || "https://www.ezshieldai.com";

    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization")!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
    } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { action, ...payload } = await req.json();

    // ── Community invite (no global-admin required, only community owner) ──────
    if (action === "invite_to_community") {
      const { emails, community_id } = payload as { emails: string[]; community_id: string };

      if (!emails?.length || !community_id) {
        return new Response(JSON.stringify({ error: "emails and community_id are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify caller owns this community
      const { data: community } = await adminClient
        .from("courses")
        .select("id, title, created_by")
        .eq("id", community_id)
        .maybeSingle();

      if (!community || community.created_by !== caller.id) {
        return new Response(JSON.stringify({ error: "You do not own this community" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results: { email: string; success: boolean; error?: string }[] = [];

      for (const email of emails) {
        try {
          // Upsert invite record (skip duplicates)
          await adminClient.from("community_invites").upsert(
            {
              community_id,
              invitee_email: email.toLowerCase().trim(),
              created_by: caller.id,
              status: "pending",
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
            { onConflict: "community_id,invitee_email", ignoreDuplicates: false }
          );

          // Invite via Supabase Auth — redirects to signup page with community pre-set
          const redirectTo = `${siteUrl}/signup?community=${community_id}&email=${encodeURIComponent(email.trim())}`;

          const { error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
            email.trim(),
            {
              redirectTo,
              data: { community_name: community.title },
            }
          );

          if (inviteErr) throw inviteErr;
          results.push({ email, success: true });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          results.push({ email, success: false, error: msg });
        }
      }

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Global-admin-only actions ─────────────────────────────────────────────
    const { data: roleCheck } = await callerClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "invite") {
      const { email } = payload;
      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true, user: data.user }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      const { email, full_name, title, company, location } = payload;
      if (!email) {
        return new Response(JSON.stringify({ error: "Email is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tempPassword = crypto.randomUUID();
      const { data: newUser, error: createError } =
        await adminClient.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: full_name || "" },
        });
      if (createError) throw createError;

      if (newUser.user) {
        await adminClient
          .from("profiles")
          .update({
            full_name: full_name || null,
            title: title || null,
            company: company || null,
            location: location || null,
          })
          .eq("id", newUser.user.id);

        await adminClient.from("user_roles").insert({
          user_id: newUser.user.id,
          role: "member",
        });
      }

      await adminClient.auth.admin.generateLink({
        type: "recovery",
        email,
      });

      return new Response(
        JSON.stringify({ success: true, user: newUser.user }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
