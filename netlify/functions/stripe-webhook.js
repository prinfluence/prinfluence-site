// Netlify Function: stripe-webhook
// Fires when a Stripe checkout completes.
// Creates a Supabase Auth account for the customer,
// records their purchase, and sends a magic login link via Resend.

const crypto = require("crypto");

// Map Stripe Price IDs to product keys
const PRICE_TO_PRODUCT = {
  "price_1ThiS3LDK5PQzuQazbaXKAfB": "content-vault",
  "price_1Thi73LDK5PQzuQamCmudJgc": "outreach-tracker",
  "price_1ThgsMLDK5PQzuQaU83ov9Wt": "pitch-paid",
  "price_1ThicKLDK5PQzuQaGCncEJr3": "dealworthy",
};

function verifyStripeSignature(payload, signature, secret) {
  const parts = signature.split(",").reduce((acc, part) => {
    const [key, value] = part.split("=");
    acc[key] = value;
    return acc;
  }, {});

  const timestamp = parts.t;
  const sigHash = parts.v1;
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSig),
    Buffer.from(sigHash)
  );
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const siteUrl = process.env.SITE_URL || "https://www.prinfluence.com";

  // Verify Stripe signature
  const signature = event.headers["stripe-signature"];
  if (webhookSecret && signature) {
    try {
      if (!verifyStripeSignature(event.body, signature, webhookSecret)) {
        return { statusCode: 400, body: "Invalid signature" };
      }
    } catch (err) {
      return { statusCode: 400, body: "Signature verification failed" };
    }
  }

  let stripeEvent;
  try {
    stripeEvent = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  if (stripeEvent.type !== "checkout.session.completed") {
    return { statusCode: 200, body: "Ignored" };
  }

  const session = stripeEvent.data.object;
  const email = session.customer_details?.email || session.customer_email;
  const priceId = session.line_items?.data?.[0]?.price?.id ||
    session.metadata?.price_id;

  // Get price ID from line items via Stripe API if not in session
  let productKey = PRICE_TO_PRODUCT[priceId];

  if (!productKey && stripeSecret) {
    try {
      const lineItemsRes = await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${session.id}/line_items`,
        { headers: { Authorization: `Bearer ${stripeSecret}` } }
      );
      const lineItems = await lineItemsRes.json();
      const firstPriceId = lineItems.data?.[0]?.price?.id;
      productKey = PRICE_TO_PRODUCT[firstPriceId];
    } catch (err) {
      console.error("Failed to fetch line items:", err);
    }
  }

  if (!email) {
    console.error("No email in session:", session.id);
    return { statusCode: 200, body: "No email" };
  }

  console.log(`Processing purchase: ${email} → ${productKey || "unknown"}`);

  // 1. Create or find user in Supabase Auth
  let userId = null;
  if (supabaseUrl && supabaseKey) {
    try {
      // Try to create the user
      const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          email,
          email_confirm: false, // They'll confirm via our magic link email
          user_metadata: { source: "stripe_purchase" },
        }),
      });

      const userData = await createRes.json();

      if (createRes.ok) {
        userId = userData.id;
        console.log("Created new user:", userId);
      } else if (userData.msg?.includes("already been registered") || userData.code === "email_exists") {
        // User already exists — look them up
        const listRes = await fetch(
          `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
          }
        );
        const listData = await listRes.json();
        userId = listData.users?.[0]?.id;
        console.log("Found existing user:", userId);
      } else {
        console.error("User creation error:", userData);
      }
    } catch (err) {
      console.error("Supabase auth error:", err);
    }

    // 2. Record the purchase
    if (productKey) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/purchases`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            email,
            product: productKey,
            stripe_session_id: session.id,
            amount_paid: session.amount_total,
            user_id: userId,
          }),
        });
        console.log("Purchase recorded:", productKey);
      } catch (err) {
        console.error("Purchase record error:", err);
      }
    }

    // 3. Generate a magic link for first-time access
    if (userId && supabaseKey) {
      try {
        const magicRes = await fetch(
          `${supabaseUrl}/auth/v1/admin/users/${userId}/magiclinks`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              redirect_to: `${siteUrl}/dashboard.html`,
            }),
          }
        );
        const magicData = await magicRes.json();
        const magicLink = magicData.action_link;

        // 4. Send purchase confirmation email with access link
        if (resendKey && magicLink) {
          const productNames = {
            "content-vault": "The Content Vault",
            "outreach-tracker": "Outreach Tracker + AI Pitch Analyzer",
            "pitch-paid": "[Pitch] $Paid, Period.",
            "dealworthy": "Deal Worthy — UGC Starter Kit",
          };

          const productName = productNames[productKey] || "your product";

          const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F6F3EE;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F6F3EE;padding:40px 20px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;">

  <tr><td style="background:linear-gradient(115deg,#CE4E84 0%,#A93567 50%,#C5A062 100%);padding:36px 40px 32px;">
    <div style="font-family:Georgia,serif;font-size:22px;font-weight:600;color:#ffffff;letter-spacing:-0.02em;">
      Prin<em style="font-style:italic;">fluence</em>
    </div>
    <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.75);margin-top:6px;font-weight:500;">
      Purchase confirmed
    </div>
  </td></tr>

  <tr><td style="padding:36px 40px;">
    <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:600;color:#1C1620;margin:0 0 16px;line-height:1.2;letter-spacing:-0.02em;">
      You're in. Let's get you set up.
    </h1>
    <p style="font-size:15px;color:rgba(28,22,32,0.72);line-height:1.7;margin:0 0 10px;">
      Hey! Your purchase of <strong style="color:#1C1620;">${productName}</strong> just went through.
    </p>
    <p style="font-size:15px;color:rgba(28,22,32,0.72);line-height:1.7;margin:0 0 28px;">
      Click the button below to access your product. You'll be asked to set a password so you can log back in anytime from any device.
    </p>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr><td style="background:linear-gradient(115deg,#CE4E84 0%,#A93567 50%,#C5A062 100%);border-radius:100px;padding:15px 32px;">
        <a href="${magicLink}" style="color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;white-space:nowrap;">
          Access my product →
        </a>
      </td></tr>
    </table>

    <div style="background:#F6F3EE;border-radius:12px;padding:20px 22px;margin-bottom:24px;">
      <div style="font-size:13px;color:rgba(28,22,32,0.5);line-height:1.6;">
        This link expires in 24 hours. If it expires, just go to 
        <a href="${siteUrl}/login.html" style="color:#CE4E84;">${siteUrl}/login.html</a> 
        and enter your email to get a new one.
      </div>
    </div>

    <p style="font-size:14px;color:rgba(28,22,32,0.62);line-height:1.65;margin:0 0 6px;">Questions? Just reply to this email.</p>
    <p style="font-family:Georgia,serif;font-size:18px;font-weight:600;color:#CE4E84;margin:0;font-style:italic;">— Prin</p>
    <p style="font-size:13px;color:rgba(28,22,32,0.45);margin:4px 0 0;">Founder, Prinfluence</p>
  </td></tr>

  <tr><td style="padding:20px 40px 28px;border-top:1px solid rgba(28,22,32,0.08);">
    <p style="font-size:12px;color:rgba(28,22,32,0.4);margin:0;line-height:1.6;">
      Questions? Email <a href="mailto:talktome@prinfluence.com" style="color:#CE4E84;">talktome@prinfluence.com</a>
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
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: "Prin from Prinfluence <talktome@prinfluence.com>",
              to: [email],
              subject: `You're in — access your ${productName} now`,
              html,
            }),
          });
          console.log("Purchase email sent to:", email);
        }
      } catch (err) {
        console.error("Magic link / email error:", err);
      }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
