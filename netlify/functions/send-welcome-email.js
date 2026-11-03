// Netlify Function: send-welcome-email
// Handles popup subscriptions + post-purchase welcome emails
// Saves to Supabase, sends branded welcome email with toolkit link via Resend

function subscriberEmailHtml(siteUrl, toolkitUrl) {
  const product = (letter, color, name, forWho, desc, href) => `
    <tr><td style="padding:0 0 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EFE6EA;border-radius:14px;border-collapse:separate;">
        <tr>
          <td width="62" valign="top" style="padding:18px 0 18px 18px;">
            <table role="presentation" width="44" height="44" cellpadding="0" cellspacing="0" style="background:${color};border-radius:12px;border-collapse:separate;"><tr><td align="center" valign="middle" style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:bold;color:#ffffff;">${letter}</td></tr></table>
          </td>
          <td valign="top" style="padding:16px 18px 16px 12px;font-family:Arial,Helvetica,sans-serif;">
            <div style="font-size:10.5px;letter-spacing:1.5px;text-transform:uppercase;color:#B8336A;">${forWho}</div>
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#2B2230;padding-top:3px;">${name}</div>
            <div style="font-size:13.5px;line-height:1.55;color:#6E6372;padding-top:4px;">${desc}</div>
            <div style="padding-top:8px;"><a href="${href}" style="font-size:13px;font-weight:bold;color:#E274A0;text-decoration:none;">Take a look &rarr;</a></div>
          </td>
        </tr>
      </table>
    </td></tr>`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="x-apple-disable-message-reformatting" />
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<title>A welcome gift from Prin</title>
<style>
  body,table,td{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;}
  table{border-collapse:collapse;}
  body{margin:0;padding:0;width:100%!important;background:#FBF8F4;}
  a{text-decoration:none;}
  @media only screen and (max-width:600px){
    .pad{padding-left:22px!important;padding-right:22px!important;}
    .h1{font-size:30px!important;}
    .code{font-size:26px!important;letter-spacing:3px!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#FBF8F4;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">I saved this for you: 30% off any Prinfluence tool, code inside.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F4;">
<tr><td align="center" style="padding:28px 14px;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:18px;border-collapse:separate;border-top:4px solid #E274A0;">

<!-- HEADER -->
<tr><td class="pad" style="padding:32px 38px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:bold;color:#2B2230;">Prin<i style="font-weight:normal;color:#E274A0;">fluence</i></td>
    <td align="right" style="font-family:Arial,sans-serif;font-size:10.5px;letter-spacing:2px;text-transform:uppercase;color:#B9A7B0;">A little gift</td>
  </tr></table>
</td></tr>

<!-- HERO -->
<tr><td class="pad" style="padding:34px 38px 8px;font-family:Arial,Helvetica,sans-serif;">
  <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#B8336A;padding-bottom:12px;">Welcome gift &middot; day two</div>
  <div class="h1" style="font-family:Georgia,'Times New Roman',serif;font-size:36px;line-height:1.15;color:#2B2230;">Yesterday you got the toolkit.<br /><i style="color:#E274A0;">Today you get 30% off.</i></div>
  <p style="margin:18px 0 0;font-size:15.5px;line-height:1.7;color:#4A3F4E;">Prompts get you posting. Getting paid takes more: a pitch that sounds like a pro wrote it, a way to track who you pitched, and something to post when your brain is empty. That's what my tools are for.</p>
  <p style="margin:14px 0 0;font-size:15.5px;line-height:1.7;color:#4A3F4E;">So this is for you, on any of them:</p>
</td></tr>

<!-- CODE -->
<tr><td class="pad" style="padding:22px 38px 6px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FDF1F6;border:1.5px dashed #E274A0;border-radius:14px;border-collapse:separate;">
    <tr><td align="center" style="padding:22px 16px;font-family:Arial,sans-serif;">
      <div style="font-size:10.5px;letter-spacing:2px;text-transform:uppercase;color:#B8336A;">Your code</div>
      <div class="code" style="font-family:Georgia,'Times New Roman',serif;font-size:32px;letter-spacing:5px;color:#2B2230;padding-top:6px;">HEYFRIEND30</div>
      <div style="font-size:12.5px;color:#8A7F8E;padding-top:6px;">30% off your first order. Enter it at checkout.</div>
    </td></tr>
  </table>
</td></tr>

<!-- PRODUCTS -->
<tr><td class="pad" style="padding:28px 38px 4px;">
  <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#2B2230;padding-bottom:14px;">Pick your next move</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${product("V", "#7EB8FF", "The Content Vault", "For the blank-screen days", "1,200+ hooks, ideas and CTAs, refreshed every month from the most-viewed videos in your niche. Copy, tweak, post.", siteUrl + "/content-vault-landing.html")}
    ${product("T", "#E274A0", "Outreach Tracker + AI Pitch Analyzer", "For when you're pitching brands", "Every brand you pitched and every follow-up due, in one place. The AI Pitch Analyzer checks your pitch before you hit send.", siteUrl + "/outreach-tracker-landing.html")}
    ${product("P", "#C5A062", "[Pitch] Paid, Period.", "For when you freeze at a blank email", "10 pitch templates, 8 niche breakdowns and the P.A.I.D. Framework, so you always know what to say.", siteUrl + "/pitch-vault.html")}
    ${product("D", "#A98BEA", "Deal Worthy: UGC Starter Kit", "For when you're starting from zero", "11 modules from no portfolio to your first paid deal, plus a rate calculator so you never undercharge.", siteUrl + "/dealworthy-landing.html")}
  </table>
</td></tr>

<!-- QUOTE -->
<tr><td class="pad" style="padding:18px 38px 6px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="border-left:3px solid #C5A062;padding:2px 0 2px 16px;font-family:Georgia,'Times New Roman',serif;font-size:19px;line-height:1.45;color:#2B2230;"><b>Brands can't hire a creator they've never heard from.</b></td>
  </tr></table>
</td></tr>

<!-- CLOSE -->
<tr><td class="pad" style="padding:20px 38px 30px;font-family:Arial,Helvetica,sans-serif;font-size:15.5px;line-height:1.7;color:#4A3F4E;">
  <p style="margin:0 0 16px;">Not ready? Totally fine. The Refresh is free and still lands every Sunday.</p>
  <p style="margin:0 0 20px;">But if you've been telling yourself you'll start pitching "next month," let this be your nudge to start this week. (Haven't opened your toolkit yet? <a href="${toolkitUrl}" style="color:#E274A0;font-weight:bold;">It's right here.</a>)</p>
  <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:21px;font-style:italic;color:#E274A0;">Prin &#10024;</p>
  <p style="margin:2px 0 20px;font-size:12.5px;color:#8A7F8E;">Founder, Prinfluence</p>
  <p style="margin:0;padding-top:16px;border-top:1px solid #EFE8EC;"><b>P.S.</b> Not sure which tool fits you? Hit reply with what you're stuck on, and I'll tell you exactly where I'd start.</p>
</td></tr>

</table>

<!-- FOOTER -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
  <tr><td align="center" style="padding:20px 10px 0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;">
    <a href="https://www.youtube.com/@Prinfluence" style="color:#A79DAA;padding:0 8px;">YouTube</a>
    <a href="https://www.linkedin.com/in/nwoye/" style="color:#A79DAA;padding:0 8px;">LinkedIn</a>
    <a href="https://www.tiktok.com/@prinfluence.ugc" style="color:#A79DAA;padding:0 8px;">TikTok</a>
    <a href="https://www.instagram.com/prinfluence.ugc" style="color:#A79DAA;padding:0 8px;">Instagram</a>
  </td></tr>
  <tr><td align="center" style="padding:12px 10px 0;font-family:Arial,sans-serif;font-size:11.5px;line-height:1.6;color:#A79DAA;">
    You're getting this because you subscribed at prinfluence.com. <a href="mailto:talktome@prinfluence.com?subject=Unsubscribe" style="color:#A79DAA;text-decoration:underline;">Unsubscribe</a>
  </td></tr>
</table>

</td></tr>
</table>
</body>
</html>`;
}

// Email 1: short, personal note sent right away (built to land in Primary)
function personalEmailHtml(siteUrl, toolkitUrl) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="x-apple-disable-message-reformatting"></head>
<body style="margin:0;padding:0;background:#FBF8F4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F4;">
<tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border-radius:16px;border-top:4px solid #E274A0;">
<tr><td style="padding:34px 34px 30px;font-family:Arial,Helvetica,sans-serif;font-size:15.5px;line-height:1.7;color:#2B2230;">

  <div style="font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:bold;color:#2B2230;padding-bottom:22px;">Prin<i style="font-weight:normal;color:#E274A0;">fluence</i></div>

  <p style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:1.35;color:#2B2230;">Most people download a freebie and never open it. <i style="color:#E274A0;">You're not most people.</i></p>

  <p style="margin:0 0 16px;">Your <b>50 AI Prompts Toolkit</b> is ready. Hooks, scripts, captions, brand pitches. Every prompt is fill-in-the-blank, so you never stare at an empty chat box wondering what to type.</p>

  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 22px;"><tr>
    <td style="background:#E274A0;border-radius:100px;"><a href="${toolkitUrl}" style="display:inline-block;padding:13px 26px;font-family:Arial,sans-serif;font-size:14.5px;font-weight:bold;color:#ffffff;text-decoration:none;">Open my toolkit &rarr;</a></td>
  </tr></table>

  <p style="margin:0 0 16px;">One ask: use a single prompt in the next 24 hours. Pick the first one that makes you think <i>"oh, I need that,"</i> fill in the brackets, and post whatever comes out. Messy counts.</p>

  <p style="margin:0 0 18px;padding:2px 0 2px 16px;border-left:3px solid #C5A062;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.45;color:#2B2230;"><b>The algorithm can't push a draft sitting in your notes app.</b></p>

  <p style="margin:0 0 16px;">Tomorrow I'm sending you something you won't find anywhere on my site. Watch for it.</p>

  <p style="margin:0 0 16px;">After that, <b>The Refresh</b> lands every Sunday: one idea that's working in AI content right now, readable in five minutes.</p>

  <p style="margin:0 0 22px;">Before you go, hit reply and tell me one thing: <b>what do you want to get paid for?</b> One sentence is plenty. I read every reply.</p>

  <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:21px;font-style:italic;color:#E274A0;">Prin &#10024;</p>
  <p style="margin:2px 0 22px;font-size:12.5px;color:#8A7F8E;">Founder, Prinfluence</p>

  <p style="margin:0;padding-top:16px;border-top:1px solid #EFE8EC;"><b>P.S.</b> Add talktome@prinfluence.com to your contacts so tomorrow's gift doesn't get buried. Gmail listens to you more than it listens to me. &#127873;</p>

</td></tr>
</table>
<div style="max-width:540px;padding:16px 10px 0;font-family:Arial,sans-serif;font-size:11.5px;line-height:1.6;color:#A79DAA;">You're getting this because you subscribed at prinfluence.com. <a href="mailto:talktome@prinfluence.com?subject=Unsubscribe" style="color:#A79DAA;">Unsubscribe</a></div>
</td></tr>
</table>
</body></html>`;
}

function personalEmailText(toolkitUrl) {
  return [
    "Most people download a freebie and never open it. You're not most people.",
    "",
    "Your 50 AI Prompts Toolkit is ready. Hooks, scripts, captions, brand pitches. Every prompt is fill-in-the-blank, so you never stare at an empty chat box wondering what to type.",
    "",
    "Open it here: " + toolkitUrl,
    "",
    "One ask: use a single prompt in the next 24 hours. Pick the first one that makes you think \"oh, I need that,\" fill in the brackets, and post whatever comes out. Messy counts.",
    "",
    "The algorithm can't push a draft sitting in your notes app.",
    "",
    "Tomorrow I'm sending you something you won't find anywhere on my site. Watch for it.",
    "",
    "After that, The Refresh lands every Sunday: one idea that's working in AI content right now, readable in five minutes.",
    "",
    "Before you go, hit reply and tell me one thing: what do you want to get paid for? One sentence is plenty. I read every reply.",
    "",
    "Prin",
    "Founder, Prinfluence",
    "",
    "P.S. Add talktome@prinfluence.com to your contacts so tomorrow's gift doesn't get buried. Gmail listens to you more than it listens to me.",
    "",
    "You're getting this because you subscribed at prinfluence.com. To unsubscribe, reply with the word Unsubscribe.",
  ].join("\n");
}

// Free class email: class link + the 3 templates (light style, same as Email 1)
function classEmailHtml(siteUrl, name) {
  const dl = (file) => `${siteUrl}/downloads/${file}`;
  const hi = name ? `Hey ${name.replace(/[<>&"]/g, "")},` : "Hey there,";
  const item = (title, kind, file) => `
    <tr><td style="padding:0 0 10px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #EFE6EA;border-radius:12px;border-collapse:separate;">
        <tr>
          <td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#2B2230;">${title}</div>
            <div style="font-size:12.5px;color:#8A7F8E;padding-top:2px;">${kind}</div>
          </td>
          <td align="right" style="padding:14px 16px;"><a href="${dl(file)}" style="font-family:Arial,sans-serif;font-size:13.5px;font-weight:bold;color:#E274A0;text-decoration:none;white-space:nowrap;">Download &rarr;</a></td>
        </tr>
      </table>
    </td></tr>`;
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="x-apple-disable-message-reformatting"></head>
<body style="margin:0;padding:0;background:#FBF8F4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F4;">
<tr><td align="center" style="padding:28px 14px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border-radius:16px;border-top:4px solid #E274A0;border-collapse:separate;">
<tr><td style="padding:34px 34px 30px;font-family:Arial,Helvetica,sans-serif;font-size:15.5px;line-height:1.7;color:#2B2230;">

  <div style="font-family:Georgia,'Times New Roman',serif;font-size:21px;font-weight:bold;color:#2B2230;padding-bottom:22px;">Prin<i style="font-weight:normal;color:#E274A0;">fluence</i></div>

  <p style="margin:0 0 12px;">${hi}</p>
  <p style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:23px;line-height:1.35;color:#2B2230;">Your class is ready. <i style="color:#E274A0;">Watch it before you pitch anyone.</i></p>

  <p style="margin:0 0 18px;">Most creators pitch first and figure out their rates later. You're about to do it the other way around. Watch the class, then fill in the templates while it's fresh.</p>

  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr>
    <td style="background:#E274A0;border-radius:100px;"><a href="${siteUrl}/deal-worthy-thank-you.html" style="display:inline-block;padding:13px 26px;font-family:Arial,sans-serif;font-size:14.5px;font-weight:bold;color:#ffffff;text-decoration:none;">Watch the free class &rarr;</a></td>
  </tr></table>

  <p style="margin:0 0 12px;"><b>Your 3 templates:</b></p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${item("The Three-Sentence Cold Pitch Framework", "PDF &middot; the exact pitch formula, with examples", "Three-Sentence-Cold-Pitch-Framework.pdf")}
    ${item("The Rate Floor Worksheet", "Word doc &middot; the lowest number you ever say yes to", "Rate-Floor-Worksheet.docx")}
    ${item("25 Brands Hiring Right Now", "Spreadsheet &middot; your starter pitch list", "25-Brands-Hiring-Right-Now.xlsx")}
  </table>

  <p style="margin:14px 0 18px;padding:2px 0 2px 16px;border-left:3px solid #C5A062;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.45;color:#2B2230;"><b>Know your floor before a brand asks for your rate.</b></p>

  <p style="margin:0 0 22px;">Your turn: hit reply and tell me the first brand you're going to pitch. I read every reply.</p>

  <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:21px;font-style:italic;color:#E274A0;">Prin &#10024;</p>
  <p style="margin:2px 0 22px;font-size:12.5px;color:#8A7F8E;">Founder, Prinfluence</p>

  <p style="margin:0;padding-top:16px;border-top:1px solid #EFE8EC;"><b>P.S.</b> Add talktome@prinfluence.com to your contacts. Tomorrow I'm sending you a little welcome gift, and I don't want it buried. &#127873;</p>

</td></tr>
</table>
<div style="max-width:540px;padding:16px 10px 0;font-family:Arial,sans-serif;font-size:11.5px;line-height:1.6;color:#A79DAA;">You're getting this because you signed up for the free class at prinfluence.com. <a href="mailto:talktome@prinfluence.com?subject=Unsubscribe" style="color:#A79DAA;">Unsubscribe</a></div>
</td></tr>
</table>
</body></html>`;
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
    const isClass = context === "freeclass" || context === "freeclass_templates";
    const name = (body.name || "").trim().slice(0, 60);

    const html = (isPopup || isClass) ? subscriberEmailHtml(siteUrl, toolkitUrl) : `<!DOCTYPE html>
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

    const sendEmail = async (payload) => {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) console.error("Resend error:", await res.json().catch(() => res.status));
      return res.ok;
    };
    const from = "Prin from Prinfluence <talktome@prinfluence.com>";

    if (isClass) {
      // Free class: class link + 3 templates now
      await sendEmail({
        from, to: [email],
        subject: "Your free class + 3 templates are here 🎬",
        html: classEmailHtml(siteUrl, name),
      });
      // New signups also get the welcome gift tomorrow (not when they just re-request templates)
      if (context === "freeclass") {
        await sendEmail({ from, to: [email], subject: "I saved this for you 🎁", html, scheduled_at: "in 1 day" });
      }
    } else if (isPopup) {
      // Email 1 now: short and personal
      await sendEmail({
        from, to: [email],
        subject: "Your 50 prompts are here (start with one) 👀",
        html: personalEmailHtml(siteUrl, toolkitUrl),
        text: personalEmailText(toolkitUrl),
      });
      // Email 2 tomorrow: the designed welcome with HEYFRIEND30 and products
      await sendEmail({
        from, to: [email],
        subject: "I saved this for you 🎁",
        html,
        scheduled_at: "in 1 day",
      });
    } else {
      await sendEmail({ from, to: [email], subject: "Welcome to Prinfluence — you're all set", html });
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error("Function error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Something went wrong." }) };
  }
};
