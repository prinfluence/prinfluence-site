// Netlify Function: analyze-pitch
// Scores a UGC pitch on the P.A.I.D. framework. The API key stays on the server.

const ALLOWED_ORIGINS = [
  "https://www.prinfluence.com",
  "https://prinfluence.com",
  "https://profound-babka-0b76dc.netlify.app",
];

exports.handler = async function (event) {
  const json = (statusCode, obj) => ({ statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) });

  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  // Only accept calls coming from the Prinfluence site itself
  const h = event.headers || {};
  const origin = h.origin || h.Origin || "";
  if (!ALLOWED_ORIGINS.includes(origin)) return json(403, { error: "Not allowed" });

  let pitch;
  try {
    pitch = (JSON.parse(event.body || "{}").pitch || "").toString().trim();
  } catch (e) {
    return json(400, { error: "Invalid request" });
  }
  if (pitch.length < 20) return json(400, { error: "Pitch is too short" });
  if (pitch.length > 2500) return json(400, { error: "Pitch is too long (2,500 characters max)" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(500, { error: "Server is not configured" });

  const prompt = `You are a UGC pitch coach. Analyze this pitch using the P.A.I.D. framework (Personalized opener, About you, Impact/proof, Direction/offer, CTA).

Pitch to analyze:
"${pitch}"

Respond ONLY with a valid JSON object, no markdown, no backticks:
{
  "score": <number 1-10>,
  "verdict": "<one sentence overall verdict>",
  "paid_scores": {
    "personalization": <1-10>,
    "about_you": <1-10>,
    "impact": <1-10>,
    "direction": <1-10>,
    "cta": <1-10>
  },
  "strengths": ["<strength 1>", "<strength 2>"],
  "fixes": ["<specific fix 1>", "<specific fix 2>", "<specific fix 3>"],
  "rewrite_opening": "<rewrite just the first 2 sentences to be better>"
}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Anthropic error:", res.status, data);
      return json(502, { error: "Analysis service error" });
    }
    return json(200, { content: data.content });
  } catch (err) {
    console.error("analyze-pitch error:", err);
    return json(500, { error: "Something went wrong" });
  }
};
