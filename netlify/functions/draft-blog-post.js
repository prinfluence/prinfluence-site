// Netlify Function: draft-blog-post
// Generates a draft blog post in Prin's brand voice and saves it to Supabase
// with status="draft" so she can review before it goes live.
// Triggered weekly by a scheduled function (see netlify.toml [functions] config)
// or manually from the content-agent admin page.

const TOPICS = [
  "AI tools for UGC creators",
  "how to land more brand deals",
  "pricing your UGC content",
  "building a content system that doesn't burn you out",
  "what brands actually look for in a creator pitch",
  "turning one video into a week of content",
  "the AI workflow behind a faceless content business",
  "negotiating usage rights and licensing as a creator",
];

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!apiKey || !supabaseUrl || !supabaseKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Server is missing required configuration." }) };
    }

    let topic;
    try {
      const body = JSON.parse(event.body || "{}");
      topic = body.topic;
    } catch (e) {}
    if (!topic) {
      topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    }

    const systemPrompt = `You are writing a blog post for Prinfluence, a brand for UGC creators and the brands who hire them.
Voice: direct, bold, no fluff — "a smart friend who makes tech simple." Confident but warm, never corporate.
Write a complete blog post of 700-1000 words on the given topic.
Format the body as clean HTML using <p>, <h2>, <h3>, <ul>/<li> tags — no markdown.
Return ONLY valid JSON in this exact shape, nothing else, no markdown code fences:
{"title": "...", "excerpt": "one or two sentence summary, under 160 characters", "category": "one short category like AI & Content, Creator Growth, or Workflow", "content": "<p>full HTML body...</p>"}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: `Write a post about: ${topic}` }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Anthropic error:", data);
      return { statusCode: response.status, headers, body: JSON.stringify({ error: data.error?.message || "AI generation failed" }) };
    }

    const rawText = data.content?.map((b) => b.text || "").join("") || "";
    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse AI output:", rawText);
      return { statusCode: 500, headers, body: JSON.stringify({ error: "AI output wasn't valid JSON. Try again." }) };
    }

    const slug = slugify(parsed.title) + "-" + Date.now().toString(36);

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/blog_posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        title: parsed.title,
        slug,
        excerpt: parsed.excerpt,
        content: parsed.content,
        category: parsed.category,
        status: "draft",
      }),
    });

    const inserted = await insertRes.json();
    if (!insertRes.ok) {
      console.error("Supabase insert error:", inserted);
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to save draft." }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, post: inserted[0] || inserted }) };

  } catch (err) {
    console.error("Function error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Something went wrong drafting the post." }) };
  }
};
