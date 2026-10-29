// Netlify Function: stripe-webhook
// Runs when a Stripe checkout completes. It:
//   1. verifies the request really came from Stripe,
//   2. works out which product was bought,
//   3. creates the customer's login (if new) and a one-click access link,
//   4. records the purchase so the dashboard unlocks the product,
//   5. emails the customer their access link.
// If anything goes wrong that a customer would notice, it emails the owner.

const crypto = require("crypto");

// Stripe Price ID -> product key used in the purchases table
const PRICE_TO_PRODUCT = {
  price_1ThiS3LDK5PQzuQazbaXKAfB: "content-vault",
  price_1Thi73LDK5PQzuQamCmudJgc: "outreach-tracker",
  price_1ThgsMLDK5PQzuQaU83ov9Wt: "pitch-paid",
  price_1ThicKLDK5PQzuQaGCncEJr3: "dealworthy",
};

const PRODUCT_NAMES = {
  "content-vault": "The Content Vault",
  "outreach-tracker": "Outreach Tracker and AI Pitch Analyzer",
  "pitch-paid": "[Pitch] $Paid, Period.",
  dealworthy: "Deal Worthy UGC Starter Kit",
};

const OWNER_EMAIL = "talktome@prinfluence.com";
const FROM = "Prin from Prinfluence <talktome@prinfluence.com>";

function verifyStripeSignature(payload, header, secret) {
  if (!header) return false;
  const parts = header.split(",").map((p) => p.trim().split("="));
  const t = (parts.find((p) => p[0] === "t") || [])[1];
  const sigs = parts.filter((p) => p[0] === "v1").map((p) => p[1]);
  if (!t || sigs.length === 0) return false;
  // Reject old requests (replay protection): 5 minute window
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  const expBuf = Buffer.from(expected, "hex");
  return sigs.some((s) => {
    const b = Buffer.from(s, "hex");
    return b.length === expBuf.length && crypto.timingSafeEqual(b, expBuf);
  });
}

function emailHtml({ productNames, accessUrl, usedFallback }) {
  const list = productNames.join(", ");
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F6F3EE;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F6F3EE;padding:40px 20px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;">
  <tr><td style="background:#CE4E84;padding:36px 40px 32px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:600;color:#ffffff;">Prin<em style="font-style:italic;">fluence</em></div>
    <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.8);margin-top:6px;">Purchase confirmed</div>
  </td></tr>
  <tr><td style="padding:36px 40px;">
    <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:600;color:#1C1620;margin:0 0 16px;line-height:1.2;">You're in. Let's get you set up.</h1>
    <p style="font-size:15px;color:#4a4350;line-height:1.7;margin:0 0 10px;">Thank you for your purchase of <strong style="color:#1C1620;">${list}</strong>.</p>
    <p style="font-size:15px;color:#4a4350;line-height:1.7;margin:0 0 28px;">${
      usedFallback
        ? "Click the button below, enter this email address, and choose Email link to get your secure sign in link."
        : "Click the button below to open your dashboard. You will be signed in automatically."
    }</p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;"><tr>
      <td style="background:#CE4E84;border-radius:100px;padding:15px 32px;">
        <a href="${accessUrl}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;white-space:nowrap;">${
          usedFallback ? "Go to sign in" : "Open my dashboard"
        }</a>
      </td></tr></table>
    <p style="font-size:13px;color:#7a727f;line-height:1.6;margin:0 0 24px;">This link works once and expires in about an hour. If it has expired, go to prinfluence.com/login.html, enter the email you used at checkout, and choose Email link for a new one.</p>
    <p style="font-size:14px;color:#4a4350;line-height:1.65;margin:0 0 6px;">Questions? Just reply to this email.</p>
    <p style="font-family:Georgia,serif;font-size:18px;font-weight:600;color:#CE4E84;margin:0;font-style:italic;">Prin</p>
    <p style="font-size:13px;color:#7a727f;margin:4px 0 0;">Founder, Prinfluence</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };

  const env = process.env;
  const stripeSecret = env.STRIPE_SECRET_KEY;
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = env.RESEND_API_KEY;
  const siteUrl = (env.SITE_URL || "https://www.prinfluence.com").replace(/\/$/, "");

  const missing = Object.entries({
    STRIPE_SECRET_KEY: stripeSecret,
    STRIPE_WEBHOOK_SECRET: webhookSecret,
    SUPABASE_URL: supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: supabaseKey,
    RESEND_API_KEY: resendKey,
  })
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    console.error("Missing environment variables:", missing.join(", "));
    return { statusCode: 500, body: "Server not configured" };
  }

  // Supabase secret keys (sb_secret_...) go in the apikey header ONLY.
  const sbHeaders = { "Content-Type": "application/json", apikey: supabaseKey };

  async function alertOwner(subject, text) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({ from: FROM, to: [OWNER_EMAIL], subject: `[Prinfluence alert] ${subject}`, text }),
      });
    } catch (e) {
      console.error("Could not send owner alert:", e);
    }
  }

  // 1. Verify the request is genuinely from Stripe
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf8")
    : event.body || "";
  const signature = (event.headers || {})["stripe-signature"] || (event.headers || {})["Stripe-Signature"];
  if (!verifyStripeSignature(rawBody, signature, webhookSecret)) {
    return { statusCode: 400, body: "Invalid signature" };
  }

  let stripeEvent;
  try {
    stripeEvent = JSON.parse(rawBody);
  } catch (e) {
    return { statusCode: 400, body: "Invalid JSON" };
  }
  if (stripeEvent.type !== "checkout.session.completed") return { statusCode: 200, body: "Ignored" };

  const session = stripeEvent.data.object;
  if (session.payment_status && session.payment_status !== "paid") {
    return { statusCode: 200, body: "Not paid yet" };
  }

  const email = (session.customer_details?.email || session.customer_email || "").toLowerCase().trim();
  if (!email) {
    console.error("No email on session", session.id);
    await alertOwner("Purchase with no email", `Stripe session ${session.id} had no customer email.`);
    return { statusCode: 200, body: "No email" };
  }

  // 2. Which product(s) were bought?
  const liRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session.id}/line_items?limit=10`, {
    headers: { Authorization: `Bearer ${stripeSecret}` },
  });
  const liData = await liRes.json();
  if (!liRes.ok) {
    console.error("Stripe line items error:", liData);
    return { statusCode: 500, body: "Could not read line items" }; // Stripe will retry
  }
  const priceIds = (liData.data || []).map((i) => i.price && i.price.id).filter(Boolean);
  const products = [...new Set(priceIds.map((p) => PRICE_TO_PRODUCT[p]).filter(Boolean))];
  if (products.length === 0) {
    console.error("Unrecognized price IDs:", priceIds, "session", session.id);
    await alertOwner(
      "Purchase I could not match to a product",
      `${email} paid (session ${session.id}) but the price ID(s) ${priceIds.join(", ")} are not in the webhook's product list. Add the product to their dashboard manually in Supabase.`
    );
    return { statusCode: 200, body: "Unmapped product" };
  }

  // 3. Already processed? (Stripe can deliver the same event more than once)
  const existingRes = await fetch(
    `${supabaseUrl}/rest/v1/purchases?stripe_session_id=eq.${encodeURIComponent(session.id)}&select=product`,
    { headers: sbHeaders }
  );
  if (existingRes.ok) {
    const existing = await existingRes.json();
    if (Array.isArray(existing) && existing.length >= products.length) {
      return { statusCode: 200, body: "Already processed" };
    }
  }

  // 4. Create the login (if new) and a one-click access link
  let accessUrl = `${siteUrl}/login.html`;
  let usedFallback = true;
  let userId = null;
  try {
    const glRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: sbHeaders,
      body: JSON.stringify({ type: "magiclink", email, redirect_to: `${siteUrl}/dashboard.html` }),
    });
    const gl = await glRes.json();
    if (glRes.ok && (gl.action_link || (gl.properties && gl.properties.action_link))) {
      accessUrl = gl.action_link || gl.properties.action_link;
      usedFallback = false;
      userId = gl.id || (gl.user && gl.user.id) || null;
    } else {
      console.error("generate_link failed:", glRes.status, gl);
      await alertOwner("Access link could not be created", `${email} paid, but Supabase would not create their sign in link (status ${glRes.status}). Their purchase is recorded and the email tells them to use the sign in page.`);
    }
  } catch (e) {
    console.error("generate_link error:", e);
  }

  // 5. Record the purchase (this is what unlocks the dashboard)
  const rows = products.map((product) => ({
    email,
    product,
    stripe_session_id: session.id,
    amount_paid: session.amount_total,
    user_id: userId,
  }));
  const insRes = await fetch(`${supabaseUrl}/rest/v1/purchases`, {
    method: "POST",
    headers: { ...sbHeaders, Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  });
  if (!insRes.ok) {
    const err = await insRes.text();
    console.error("Purchase insert failed:", insRes.status, err);
    await alertOwner("Purchase NOT recorded", `${email} paid for ${products.join(", ")} (session ${session.id}) but saving the purchase failed (${insRes.status}). Add it manually in Supabase. Stripe will also retry automatically.`);
    return { statusCode: 500, body: "Could not record purchase" }; // Stripe retries
  }

  // 6. Email the customer
  const productNames = products.map((p) => PRODUCT_NAMES[p]);
  try {
    const mailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        subject: `You're in. Open your ${productNames.join(" and ")}`,
        html: emailHtml({ productNames, accessUrl, usedFallback }),
      }),
    });
    if (!mailRes.ok) {
      const err = await mailRes.text();
      console.error("Resend error:", mailRes.status, err);
      await alertOwner("Customer email failed", `${email} paid and their purchase is recorded, but the confirmation email failed (${mailRes.status}): ${err}`);
    }
  } catch (e) {
    console.error("Email send error:", e);
    await alertOwner("Customer email failed", `${email} paid and their purchase is recorded, but the email could not be sent: ${e.message}`);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
