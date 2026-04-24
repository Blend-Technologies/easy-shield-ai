// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendNotificationEmail(opts: {
  resendApiKey: string;
  fromEmail: string;
  toEmail: string;
  ownerName: string;
  communityName: string;
  memberName: string;
  memberEmail: string;
  joinedAt: string;
  communityId: string;
}) {
  const hubUrl = `${Deno.env.get("SITE_URL") ?? "https://www.ezshieldai.com"}/community/hub/${opts.communityId}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1e1b4b,#312e81,#1d4ed8);border-radius:16px 16px 0 0;padding:32px 40px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#a5b4fc;">EZShield AI</p>
          <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;line-height:1.2;">New Community Member</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px 40px;">
          <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
            Hi${opts.ownerName ? ` ${opts.ownerName}` : ""},
          </p>
          <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;">
            Someone just joined your community <strong style="color:#1e293b;">${opts.communityName}</strong> via your invite link.
          </p>

          <!-- Member card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:44px;vertical-align:top;">
                    <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#fff;text-align:center;line-height:44px;">
                      ${opts.memberName.charAt(0).toUpperCase()}
                    </div>
                  </td>
                  <td style="padding-left:16px;vertical-align:top;">
                    <p style="margin:0 0 2px;font-size:16px;font-weight:700;color:#1e293b;">${opts.memberName}</p>
                    <p style="margin:0 0 6px;font-size:13px;color:#6366f1;">${opts.memberEmail}</p>
                    <p style="margin:0;font-size:12px;color:#94a3b8;">Joined ${opts.joinedAt}</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td style="background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:10px;">
              <a href="${hubUrl}?tab=members" style="display:block;padding:14px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
                View Members Tab →
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
            You're receiving this because you own the <strong>${opts.communityName}</strong> community on EZShield AI.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f1f5f9;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            © EZShield AI &nbsp;·&nbsp; <a href="https://www.ezshieldai.com" style="color:#6366f1;text-decoration:none;">ezshieldai.com</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${opts.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: opts.fromEmail,
      to: [opts.toEmail],
      subject: `New member joined ${opts.communityName}: ${opts.memberName}`,
      html,
    }),
  });
}

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

    // Fetch community + owner email in one go
    const { data: community, error: communityErr } = await supabase
      .from("courses")
      .select("id, title, created_by")
      .eq("id", communityId)
      .single();

    if (communityErr || !community) {
      return json({ error: "Community not found" }, 404);
    }

    // Upsert member
    const joinedAt = new Date().toISOString();
    const { error: insertErr } = await supabase
      .from("community_members")
      .upsert(
        { community_id: communityId, full_name: fullName.trim(), email: email.trim().toLowerCase() },
        { onConflict: "community_id,email", ignoreDuplicates: false },
      );

    if (insertErr) {
      return json({ error: insertErr.message }, 500);
    }

    // Send notification email (fire-and-forget — don't fail the join if email fails)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "EZShield AI <notifications@ezshieldai.com>";

    if (resendApiKey && community.created_by) {
      try {
        // Look up the owner's email via admin auth API
        const { data: ownerData } = await supabase.auth.admin.getUserById(community.created_by);
        const ownerEmail = ownerData?.user?.email;
        const ownerName = ownerData?.user?.user_metadata?.full_name ?? "";

        if (ownerEmail) {
          await sendNotificationEmail({
            resendApiKey,
            fromEmail,
            toEmail: ownerEmail,
            ownerName,
            communityName: community.title,
            memberName: fullName.trim(),
            memberEmail: email.trim().toLowerCase(),
            joinedAt: new Date(joinedAt).toLocaleDateString("en-US", {
              month: "long", day: "numeric", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            }),
            communityId,
          });
        }
      } catch (emailErr) {
        console.error("Failed to send notification email:", emailErr);
      }
    }

    return json({ success: true, communityName: community.title });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
