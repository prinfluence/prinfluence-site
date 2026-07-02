// Netlify Function: send-newsletter
// Sends a newsletter to every subscriber in Supabase via Resend.
// Called from the admin newsletter page after Prin writes and approves the content.

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
    const { subject, bodyHtml, adminKey } = JSON.parse(event.body || "{}");

    // Simple shared-secret check so randoms can't blast your subscriber list.
    if (!adminKey || adminKey !== process.env.NEWSLETTER_ADMIN_KEY) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "Not authorized." }) };
    }
    if (!subject || !bodyHtml) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing subject or content." }) };
    }

    const resendKey = process.env.RESEND_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!resendKey || !supabaseUrl || !supabaseKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Server is missing required configuration." }) };
    }

    // Pull every subscriber email from Supabase
    const subRes = await fetch(`${supabaseUrl}/rest/v1/subscribers?select=email`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    const subscribers = await subRes.json();

    if (!Array.isArray(subscribers) || subscribers.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, sent: 0, message: "No subscribers found." }) };
    }

    const wrappedHtml = `
      <div style="font-family:'DM Sans',Arial,sans-serif;background:#F6F3EE;padding:40px 20px;">
        <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:18px;padding:44px 38px;">
          <div style="font-family:Georgia,serif;font-size:20px;font-weight:600;color:#1C1620;margin-bottom:28px;">
            Prin<span style="font-style:italic;color:#CE4E84;">fluence</span>
          </div>
          ${bodyHtml}
          <p style="font-size:11.5px;color:rgba(28,22,32,0.4);margin-top:40px;border-top:1px solid rgba(28,22,32,0.08);padding-top:20px;">
            You're receiving this because you subscribed at prinfluence.com.
          </p>
        </div>
      </div>
    `;

    // Resend supports batch sending — send in chunks of 100 (their per-request limit)
    const emails = subscribers.map((s) => s.email).filter(Boolean);
    const chunkSize = 100;
    let totalSent = 0;

    for (let i = 0; i < emails.length; i += chunkSize) {
      const chunk = emails.slice(i, i + chunkSize);
      const response = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify(
          chunk.map((email) => ({
            from: "Prin from Prinfluence <prin@prinfluence.com>",
            to: [email],
            subject,
            html: wrappedHtml,
          }))
        ),
      });

      if (response.ok) {
        totalSent += chunk.length;
      } else {
        const errData = await response.json();
        console.error("Resend batch error:", errData);
      }
    }

    // Log the send
    await fetch(`${supabaseUrl}/rest/v1/newsletter_log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ type: "weekly", subject, sent_count: totalSent }),
    });

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, sent: totalSent, total: emails.length }) };

  } catch (err) {
    console.error("Function error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Something went wrong sending the newsletter." }) };
  }
};
