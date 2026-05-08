// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Always return HTTP 200 so the Supabase JS client surfaces res.data instead of
// swallowing the body inside a generic FunctionsHttpError.
const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const siteUrl = Deno.env.get("SITE_URL") ?? "https://www.ezshieldai.com";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "EZShield AI <notifications@ezshieldai.com>";

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json();
    const { action } = body;

    // ── Lookup invitation by token (public, no auth required) ───────────────
    if (action === "lookup") {
      const { token } = body;
      if (!token) return json({ error: "token is required" });

      const { data: invite, error } = await adminClient
        .from("team_invitations")
        .select("id, email, full_name, title, status, expires_at, teams(name, slug)")
        .eq("token", token)
        .maybeSingle();

      if (error || !invite) return json({ error: "Invitation not found" });
      if (invite.status === "accepted") return json({ error: "Invitation already accepted", invite });
      if (new Date(invite.expires_at) < new Date()) return json({ error: "Invitation expired", invite });

      return json({ invite });
    }

    // All other actions require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" });

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) return json({ error: "Unauthorized" });

    // ── Send invitation ─────────────────────────────────────────────────────
    if (action === "send") {
      const { team_id, email, full_name, title } = body;
      if (!team_id || !email || !full_name || !title) {
        return json({ error: "team_id, email, full_name, and title are required" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) return json({ error: "Invalid email address" });

      // Verify caller is a member of this team
      const { data: membership } = await adminClient
        .from("team_members")
        .select("id")
        .eq("team_id", team_id)
        .eq("user_id", caller.id)
        .maybeSingle();

      if (!membership) return json({ error: "You are not a member of this team" });

      const { data: team } = await adminClient
        .from("teams")
        .select("id, name, slug")
        .eq("id", team_id)
        .single();

      if (!team) return json({ error: "Team not found" });

      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error: inviteErr } = await adminClient
        .from("team_invitations")
        .upsert({
          team_id,
          email: email.trim().toLowerCase(),
          full_name: full_name.trim(),
          title,
          token,
          invited_by: caller.id,
          status: "pending",
          expires_at: expiresAt,
        }, { onConflict: "team_id,email" });

      if (inviteErr) return json({ error: inviteErr.message });

      const { data: callerProfile } = await adminClient
        .from("profiles")
        .select("full_name")
        .eq("id", caller.id)
        .maybeSingle();
      const inviterName = callerProfile?.full_name || "A team member";

      if (resendApiKey) {
        const joinUrl = `${siteUrl}/join-team?token=${token}`;
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [email.trim()],
              subject: `You've been invited to join the ${team.name} team on EZShield AI`,
              html: buildInviteEmail({ inviterName, teamName: team.name, fullName: full_name.trim(), title, joinUrl }),
            }),
          });
        } catch (emailErr) {
          console.error("Failed to send invite email:", emailErr);
        }
      }

      return json({ success: true });
    }

    // ── Accept invitation ───────────────────────────────────────────────────
    if (action === "accept") {
      const { token } = body;
      if (!token) return json({ error: "token is required" });

      const { data: invite, error: fetchErr } = await adminClient
        .from("team_invitations")
        .select("id, team_id, email, full_name, title, status, expires_at")
        .eq("token", token)
        .maybeSingle();

      if (fetchErr || !invite) return json({ error: "Invitation not found" });
      if (invite.status === "accepted") return json({ error: "Invitation already accepted" });
      if (new Date(invite.expires_at) < new Date()) return json({ error: "Invitation has expired" });

      const { error: memberErr } = await adminClient
        .from("team_members")
        .upsert({ team_id: invite.team_id, user_id: caller.id, role: invite.title },
          { onConflict: "team_id,user_id" });

      if (memberErr) return json({ error: memberErr.message });

      await adminClient
        .from("team_invitations")
        .update({ status: "accepted" })
        .eq("id", invite.id);

      // Update profile name/title only if not already set
      const { data: profile } = await adminClient
        .from("profiles")
        .select("full_name, title")
        .eq("id", caller.id)
        .maybeSingle();

      const profileUpdates: Record<string, string> = {};
      if (!profile?.full_name) profileUpdates.full_name = invite.full_name;
      if (!profile?.title) profileUpdates.title = invite.title;
      if (Object.keys(profileUpdates).length > 0) {
        await adminClient.from("profiles").update(profileUpdates).eq("id", caller.id);
      }

      return json({ success: true, team_id: invite.team_id });
    }

    // ── Cancel invitation ───────────────────────────────────────────────────
    if (action === "cancel") {
      const { invitation_id, team_id } = body;
      if (!invitation_id || !team_id) return json({ error: "invitation_id and team_id are required" });

      // Verify caller is a member of this team
      const { data: membership } = await adminClient
        .from("team_members")
        .select("id")
        .eq("team_id", team_id)
        .eq("user_id", caller.id)
        .maybeSingle();

      if (!membership) return json({ error: "You are not a member of this team" });

      const { error: delErr } = await adminClient
        .from("team_invitations")
        .delete()
        .eq("id", invitation_id)
        .eq("team_id", team_id);

      if (delErr) return json({ error: delErr.message });

      return json({ success: true });
    }

    return json({ error: "Invalid action" });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" });
  }
});

function buildInviteEmail(opts: {
  inviterName: string;
  teamName: string;
  fullName: string;
  title: string;
  joinUrl: string;
}) {
  const { inviterName, teamName, fullName, title, joinUrl } = opts;
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr><td style="background:linear-gradient(135deg,#1e1b4b,#312e81,#1d4ed8);border-radius:16px 16px 0 0;padding:32px 40px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#a5b4fc;">EZShield AI</p>
          <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;line-height:1.2;">You're Invited to Join a Team</h1>
        </td></tr>

        <tr><td style="background:#ffffff;padding:32px 40px;">
          <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">Hi ${fullName},</p>
          <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
            <strong style="color:#1e293b;">${inviterName}</strong> has invited you to join the
            <strong style="color:#1e293b;">${teamName}</strong> team on EZShield AI
            as a <strong style="color:#1e293b;">${title}</strong>.
          </p>
          <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;">
            Click the button below to accept your invitation. This link expires in 7 days.
          </p>

          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:10px;">
              <a href="${joinUrl}" style="display:block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
                Accept Invitation
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.8;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${joinUrl}" style="color:#6366f1;word-break:break-all;">${joinUrl}</a>
          </p>
        </td></tr>

        <tr><td style="background:#f1f5f9;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            &copy; EZShield AI &nbsp;&middot;&nbsp;
            <a href="https://www.ezshieldai.com" style="color:#6366f1;text-decoration:none;">ezshieldai.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
