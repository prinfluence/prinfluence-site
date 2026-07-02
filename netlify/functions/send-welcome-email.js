// Netlify Function: send-welcome-email
// Triggered right after a visitor subscribes on the Resources page.
// Sends a branded welcome email via Resend.

exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { email } = JSON.parse(event.body || "{}");
    if (!email || typeof email !== "string") {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing email" }) };
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Email service not configured yet." }) };
    }

    const html = `
      <div style="font-family:'DM Sans',Arial,sans-serif;background:#F6F3EE;padding:40px 20px;">
        <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:18px;padding:44px 38px;">
          <div style="font-family:Georgia,serif;font-size:22px;font-weight:600;color:#1C1620;margin-bottom:28px;">
            Prin<span style="font-style:italic;color:#CE4E84;">fluence</span>
          </div>
          <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:500;color:#1C1620;margin:0 0 16px;line-height:1.2;">
            Welcome — you're in.
          </h1>
          <p style="font-size:15px;color:rgba(28,22,32,0.7);line-height:1.65;margin:0 0 16px;">
            Hey! I'm Prin — thanks for joining. Every week I'll send you what's actually working in UGC, AI content strategy, and landing brand deals. No fluff, just what I'm testing and learning in real time.
          </p>
          <p style="font-size:15px;color:rgba(28,22,32,0.7);line-height:1.65;margin:0 0 28px;">
            While you wait for the first one, check out the free resources and tools already on the site.
          </p>
          <a href="https://www.prinfluence.com/Resources.html" style="display:inline-block;background:#CE4E84;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:100px;">
            Explore Resources →
          </a>
          <p style="font-size:12.5px;color:rgba(28,22,32,0.4);margin-top:36px;">
            — Prin, founder of Prinfluence
          </p>
        </div>
      </div>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Prin from Prinfluence <prin@prinfluence.com>",
        to: [email],
        subject: "Welcome to Prinfluence 👋",
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend error:", data);
      return { statusCode: response.status, headers, body: JSON.stringify({ error: data.message || "Email send failed" }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, id: data.id }) };

  } catch (err) {
    console.error("Function error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Something went wrong sending the welcome email." }) };
  }
};
