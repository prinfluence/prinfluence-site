// Netlify Function: send-welcome-email
// Handles popup subscriptions + post-purchase welcome emails
// Saves to Supabase, sends branded welcome email with toolkit link via Resend

function subscriberEmailHtml(siteUrl, toolkitUrl) {
  const card = (color, textColor, letter, label, title, desc, href, cta) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;background:#1B1228;border:1px solid #2A2032;">
    <tr>
      <td width="70" style="padding:20px;"><table width="46" height="46" cellpadding="0" cellspacing="0" style="background:${color};border-radius:12px;"><tr><td align="center" valign="middle" style="font-family:Georgia,serif;font-weight:bold;color:${textColor};font-size:20px;">${letter}</td></tr></table></td>
      <td style="padding:20px 12px;font-family:Arial,sans-serif;">
        <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#9A8FA0;">${label}</div>
        <div style="font-family:Georgia,serif;font-size:19px;color:#F7F0F6;padding-top:3px;">${title}</div>
        <div style="font-size:13px;color:#9A8FA0;padding-top:5px;line-height:1.5;">${desc}</div>
      </td>
      <td width="90" align="right" style="padding:20px;"><a href="${href}" style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#E274A0;white-space:nowrap;">${cta} &rarr;</a></td>
    </tr>
  </table>`;

  const step = (n, title, desc, last) => `
    <tr valign="top">
      <td width="34"${last ? "" : ' style="padding-bottom:22px;"'}><table width="26" height="26" cellpadding="0" cellspacing="0" style="border:1.5px solid #E274A0;border-radius:50%;"><tr><td align="center" valign="middle" style="font-family:Arial,sans-serif;font-size:11px;color:#E274A0;">${n}</td></tr></table></td>
      <td style="${last ? "" : "padding-bottom:22px;"}font-family:Arial,sans-serif;">
        <div style="font-family:Georgia,serif;font-size:16.5px;color:#F7F0F6;">${title}</div>
        <div style="font-size:13.5px;color:#9A8FA0;padding-top:4px;line-height:1.5;">${desc}</div>
      </td>
    </tr>`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="x-apple-disable-message-reformatting" />
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<title>Welcome to Prinfluence</title>
<style>
  body,table,td{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;}
  img{border:0;line-height:100%;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}
  table{border-collapse:collapse!important;}
  body{margin:0;padding:0;width:100%!important;background:#0A0612;}
  a{text-decoration:none;}
  @media only screen and (max-width:620px){
    .wrap{width:100%!important;}
    .pad{padding-left:20px!important;padding-right:20px!important;}
    .stack{display:block!important;width:100%!important;}
    .h1{font-size:38px!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#0A0612;">
<!-- preheader -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Your free 50 AI Prompts Toolkit is inside, plus 30% off with code HEYFRIEND30.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0A0612;">
<tr><td align="center" style="padding:32px 12px;">

<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#150C1E;">

<!-- HERO -->
<tr><td class="pad" style="padding:28px 40px 40px;background:#0A0612;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#F7F0F6;font-weight:bold;">Prin<i style="font-weight:normal;color:#E274A0;">fluence</i></td>
      <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9A8FA0;">Welcome aboard</td>
    </tr>
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:70px;">
    <tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#E274A0;padding-bottom:14px;">You just made a great decision</td></tr>
    <tr><td class="h1" style="font-family:Georgia,'Times New Roman',serif;font-size:56px;line-height:1;letter-spacing:-1px;color:#F7F0F6;">You're <i style="color:#E274A0;">in</i>.</td></tr>
    <tr><td style="padding-top:18px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#C9BFCB;max-width:420px;">Your free <b style="color:#F7F0F6;">50 AI Prompts Toolkit</b> is ready. Fifty copy-paste prompts for hooks, scripts, captions and pitches that work in ChatGPT, Claude or Gemini.</td></tr>
    <tr><td style="padding-top:26px;">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="background:#E274A0;border-radius:100px;">
          <a href="${toolkitUrl}" style="display:inline-block;padding:15px 32px;font-family:Arial,sans-serif;font-size:14.5px;font-weight:bold;color:#150C1E;">Open my free toolkit &rarr;</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</td></tr>

<!-- NOTE -->
<tr><td class="pad" style="padding:40px 44px 8px;background:#150C1E;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#F7F0F6;">Hey, and welcome!</td></tr>
    <tr><td style="padding-top:18px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;color:#C9BFCB;">I'm so glad you're here. Whether you're posting your first video or your five-hundredth, you just decided the same thing I did: <i style="color:#E274A0;">the tools are finally good enough to stop holding us back.</i></td></tr>
    <tr><td style="padding:24px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="border-left:3px solid #E274A0;">
        <tr><td style="padding-left:18px;font-family:Georgia,'Times New Roman',serif;font-size:21px;line-height:1.4;color:#F7F0F6;">You don't need more time, more talent, or a bigger team. You need a <i style="color:#E274A0;">system</i>. That's exactly what we build here, together, one week at a time.</td></tr>
      </table>
    </td></tr>
    <tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;color:#C9BFCB;">Every Sunday, <b style="color:#F7F0F6;">The Refresh</b> lands in your inbox. It's short on purpose: one real idea, a few things to try, and the occasional thing I'm genuinely excited about. Read it in five minutes, then go make something. That's the whole deal.</td></tr>
    <tr><td style="padding-top:26px;">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td width="52" style="padding-right:14px;">
            <table role="presentation" width="52" height="52" cellpadding="0" cellspacing="0" style="background:#E274A0;border-radius:50%;"><tr><td align="center" valign="middle" style="font-family:Georgia,serif;font-style:italic;color:#150C1E;font-size:20px;">P</td></tr></table>
          </td>
          <td style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:20px;color:#F7F0F6;">Prin<br /><span style="font-family:Arial,sans-serif;font-style:normal;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#9A8FA0;">Founder, Prinfluence</span></td>
        </tr>
      </table>
    </td></tr>
  </table>
</td></tr>

<!-- PRODUCTS -->
<tr><td class="pad" style="padding:36px 44px 0;background:#150C1E;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#E274A0;border-bottom:1px solid #2A2032;padding-bottom:14px;">Start here &middot; where to go next</td></tr></table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:16px 0 8px;font-family:Arial,sans-serif;font-size:14.5px;line-height:1.6;color:#C9BFCB;">No rush. The Refresh is always free. When you're ready to move faster, here's a welcome gift for your first order:</td></tr></table>

  <!-- code -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;border:1.5px dashed #E274A0;">
    <tr><td align="center" style="padding:18px 16px;font-family:Arial,sans-serif;">
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9A8FA0;">30% off your first order</div>
      <div style="font-family:Georgia,serif;font-size:28px;letter-spacing:3px;color:#F7F0F6;padding-top:6px;">HEYFRIEND30</div>
      <div style="font-size:12px;color:#9A8FA0;padding-top:6px;">Enter it at checkout on any product below.</div>
    </td></tr>
  </table>
  ${card("#7EB8FF", "#150C1E", "V", "Monthly membership", "The Content Vault", "Fresh hooks, ideas and CTAs every month, modeled on the most-viewed videos in your niche.", siteUrl + "/content-vault-landing.html", "Explore")}
  ${card("#E274A0", "#ffffff", "T", "Tool", "Outreach Tracker + AI Pitch Analyzer", "Track every brand you pitch and check your pitch with AI before you hit send.", siteUrl + "/outreach-tracker-landing.html", "Explore")}
  ${card("#C5A062", "#1A1206", "P", "Template vault", "[Pitch] Paid, Period.", "10 pitch templates, 8 niche breakdowns and the P.A.I.D. Framework.", siteUrl + "/pitch-vault.html", "Explore")}
  ${card("#B79CFF", "#150C1E", "D", "Starter kit", "Deal Worthy: UGC Starter Kit", "Everything you need to go from zero to your first brand deal.", siteUrl + "/dealworthy-landing.html", "Explore")}
  <div style="height:6px;line-height:6px;">&nbsp;</div>
</td></tr>

<!-- WHAT'S NEXT -->
<tr><td class="pad" style="padding:36px 44px 10px;background:#150C1E;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#E274A0;border-bottom:1px solid #2A2032;padding-bottom:14px;">What happens next</td></tr></table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
    ${step(1, "This Sunday, your first issue lands", "Look for The Refresh from Prin in your inbox. Drag it to your primary tab so it never gets lost.")}
    ${step(2, "Try one thing. Just one.", "Open the toolkit, pick one prompt, and use it today. Momentum beats perfection.")}
    ${step(3, "Hit reply anytime", "Stuck on something? Tell me what you're building. I read every reply.", true)}
  </table>
</td></tr>

<!-- CLOSE -->
<tr><td align="center" class="pad" style="padding:44px 44px;background:#0A0612;">
  <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#E274A0;">One last thing</div>
  <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.3;color:#F7F0F6;padding-top:16px;">The best time to start was a year ago.<br />The second best time is <i style="color:#E274A0;">this week</i>.</div>
  <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#C9BFCB;padding-top:14px;max-width:400px;margin:0 auto;">You've already done the hard part: you showed up. Now let's turn that into something you're proud of.</div>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 0;">
    <tr><td align="center" style="background:#E274A0;border-radius:100px;">
      <a href="${siteUrl}" style="display:inline-block;padding:15px 32px;font-family:Arial,sans-serif;font-size:14.5px;font-weight:bold;color:#150C1E;">Explore everything &rarr;</a>
    </td></tr>
  </table>
  <div style="font-family:Arial,sans-serif;font-size:11.5px;color:#7A6F80;padding-top:20px;">Glad you're here, <b style="color:#E274A0;">Prin</b></div>
</td></tr>

<!-- FOOTER -->
<tr><td class="pad" style="padding:28px 44px 36px;background:#0A0612;border-top:1px solid #2A2032;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;">
        <a href="https://www.youtube.com/@Prinfluence" style="color:#9A8FA0;padding-right:14px;">YouTube</a><a href="https://www.linkedin.com/in/nwoye/" style="color:#9A8FA0;padding-right:14px;">LinkedIn</a><a href="https://www.tiktok.com/@prinfluence.ugc" style="color:#9A8FA0;padding-right:14px;">TikTok</a><a href="https://www.instagram.com/prinfluence.ugc" style="color:#9A8FA0;">Instagram</a>
      </td>
      <td align="right" style="font-family:Georgia,serif;font-size:15px;color:#F7F0F6;">Prin<i style="color:#E274A0;">fluence</i></td>
    </tr>
  </table>
  <div style="font-family:Arial,sans-serif;font-size:11px;color:#5F5566;line-height:1.7;padding-top:18px;">
    You're getting this because you subscribed at prinfluence.com. Welcome aboard.<br />
    <a href="mailto:talktome@prinfluence.com?subject=Unsubscribe" style="color:#9A8FA0;text-decoration:underline;">Unsubscribe</a> &middot; 2026 Prinfluence
  </div>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

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
    // Subscribers (homepage popup or newsletter form) get the free toolkit email
    const isPopup = context === "popup" || context === "newsletter";

    const html = isPopup ? subscriberEmailHtml(siteUrl, toolkitUrl) : `<!DOCTYPE html>
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
      ? "You're in! Your free 50 AI Prompts Toolkit is inside ✦"
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
