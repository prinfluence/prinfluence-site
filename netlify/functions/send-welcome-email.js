// Netlify Function: send-welcome-email
// Handles popup subscriptions + post-purchase welcome emails
// Saves to Supabase, sends branded welcome email with toolkit link via Resend

exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  try {
    let body = {};
    try { body = JSON.parse(event.body || "{}"); } catch(e) {}
    
    const email = (body.email || "").trim().toLowerCase();
    const context = body.context || "general";
    const source = body.source || "website";

    if (!email || !email.includes("@")) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing email" }) };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    const siteUrl = process.env.SITE_URL || "https://www.prinfluence.com";

    // Save to Supabase subscribers table
    if (supabaseUrl && supabaseKey) {
      await fetch(`${supabaseUrl}/rest/v1/subscribers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ email, source, page_url: source }),
      }).catch(err => console.error("Supabase save failed:", err));
    }

    if (!resendKey) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: "Saved but email not configured yet." }) };
    }

    const toolkitUrl = `${siteUrl}/ai-prompts-toolkit.html`;
    const isPopup = context === "popup";

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F6F3EE;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F6F3EE;padding:40px 20px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;">

  <!-- Header gradient -->
  <tr><td style="background:linear-gradient(115deg,#CE4E84 0%,#A93567 50%,#C5A062 100%);padding:36px 40px 32px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:600;color:#ffffff;letter-spacing:-0.02em;">
      Prin<em style="font-style:italic;">fluence</em>
    </div>
    <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.75);margin-top:6px;font-weight:500;">
      ${isPopup ? "Your free gift is inside" : "Welcome to your products"}
    </div>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:36px 40px;">
    <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:600;color:#1C1620;margin:0 0 16px;line-height:1.2;letter-spacing:-0.02em;">
      ${isPopup ? "You're in. Here's your free toolkit." : "Welcome — you're all set."}
    </h1>
    <p style="font-size:15px;color:rgba(28,22,32,0.72);line-height:1.7;margin:0 0 24px;">
      ${isPopup
        ? "Hey! I'm Prin. Thanks for joining — I'm sending you the <strong style='color:#1C1620;'>50 AI Prompts Toolkit</strong> right now. These are the exact prompts I use to create content that actually converts. Copy, fill in the brackets, and go."
        : "Hey! I'm Prin. You've got everything you need to get started. Head to your dashboard to access your products anytime."}
    </p>

    <!-- CTA button -->
    <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr><td style="background:linear-gradient(115deg,#CE4E84 0%,#A93567 50%,#C5A062 100%);border-radius:100px;padding:15px 32px;">
        <a href="${isPopup ? toolkitUrl : siteUrl + '/dashboard.html'}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;white-space:nowrap;">
          ${isPopup ? "Open your 50 AI Prompts Toolkit →" : "Go to my dashboard →"}
        </a>
      </td></tr>
    </table>

    ${isPopup ? `
    <!-- What's inside -->
    <div style="background:#F6F3EE;border-radius:12px;padding:22px 24px;margin-bottom:24px;">
      <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(28,22,32,0.45);font-weight:600;margin-bottom:14px;">What's in the toolkit</div>
      <div style="font-size:14px;color:#1C1620;line-height:1.7;">
        ✦ 50 plug-and-play prompts for content that sells<br>
        ✦ Works in Claude, ChatGPT or Gemini<br>
        ✦ Built for both brands and creators<br>
        ✦ Hooks, scripts, captions, pitches and more
      </div>
    </div>
    <p style="font-size:14px;color:rgba(28,22,32,0.62);line-height:1.65;margin:0 0 20px;">
      Every Sunday I send one short email with what's actually working in AI content — new prompts, tools, and real workflows. That starts this week.
    </p>` : ""}

    <!-- Sign off -->
    <p style="font-size:14px;color:rgba(28,22,32,0.62);line-height:1.65;margin:0 0 6px;">Glad you're here,</p>
    <p style="font-family:Georgia,serif;font-size:18px;font-weight:600;color:#CE4E84;margin:0;font-style:italic;">— Prin</p>
    <p style="font-size:13px;color:rgba(28,22,32,0.45);margin:4px 0 0;">Founder, Prinfluence</p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 40px 28px;border-top:1px solid rgba(28,22,32,0.08);">
    <p style="font-size:12px;color:rgba(28,22,32,0.4);margin:0;line-height:1.6;">
      You're getting this because you subscribed at prinfluence.com.<br>
      <a href="${siteUrl}" style="color:#CE4E84;text-decoration:none;">Visit Prinfluence</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

    const subject = isPopup
      ? "Your 50 AI Prompts Toolkit is here ✦"
      : "Welcome to Prinfluence — you're all set";

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Prin from Prinfluence <talktome@prinfluence.com>",
        to: [email],
        subject,
        html,
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.json();
      console.error("Resend error:", err);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error("Function error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Something went wrong." }) };
  }
};
