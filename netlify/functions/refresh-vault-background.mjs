// Background function: pulls the most-viewed YouTube videos per niche (last 30 days),
// turns them into hooks, ideas and CTAs with Claude, saves them to vault_content,
// and saves a real "common thread" insight to vault_insights.
// Runs up to 15 minutes. Triggered monthly by refresh-vault-monthly.mjs.

const env = (k) => (globalThis.Netlify ? Netlify.env.get(k) : process.env[k]);

const NICHES = {
  fitness: "fitness workout tips",
  finance: "personal finance money tips",
  beauty: "skincare makeup tips",
  business: "small business entrepreneur tips",
  food: "easy recipe",
  productivity: "productivity tips",
  mindset: "mindset motivation",
};

const PER_NICHE = { hook: 25, idea: 20, cta: 13 };

const PATTERNS = {
  A: { label: "Contrarian, myth-busting", quote: "You were never taught this.", tip: "Lead by challenging a belief your audience holds, then deliver the fix." },
  B: { label: "How-to and tutorial", quote: "Here's exactly how.", tip: "Promise one clear outcome in the first line, then show the steps." },
  C: { label: "Number and list", quote: "5 things nobody tells you.", tip: "Put a specific number up front so viewers know what they're getting." },
  D: { label: "Personal story and experiment", quote: "I tried this for 30 days.", tip: "Open with what you did and hint at the result, then pay it off." },
  E: { label: "Question", quote: "Why does nobody talk about this?", tip: "Ask the question your audience is already asking themselves." },
  F: { label: "Challenge and transformation", quote: "Watch this change.", tip: "Show the before, promise the after, and make them stay for it." },
};

export default async (req) => {
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key || req.headers.get("x-refresh-key") !== key) {
    console.log("Refresh blocked: missing or wrong key");
    return;
  }

  const month = new Date().toISOString().slice(0, 7);
  const allTitles = []; // {niche, title, views}
  let inserted = 0;

  // Clear this month's YouTube rows so a re-run doesn't duplicate
  await sb(`vault_content?month_batch=eq.${month}&source=eq.youtube`, "DELETE");

  for (const [niche, query] of Object.entries(NICHES)) {
    try {
      const videos = await topVideos(query);
      console.log(`${niche}: ${videos.length} videos`);
      if (!videos.length) continue;
      videos.forEach((v) => allTitles.push({ niche, title: v.title, views: v.views }));

      const items = await generateForNiche(niche, videos);
      const rows = items
        .filter((it) => it.text && videos[it.source] && PER_NICHE[it.type])
        .map((it) => {
          const v = videos[it.source];
          return {
            type: it.type,
            niche,
            text: it.text,
            source: "youtube",
            month_batch: month,
            is_new: true,
            saved: false,
            engagement_score: Math.min(v.views, 2147483647),
            source_url: `https://www.youtube.com/watch?v=${v.id}`,
            source_title: v.title,
            source_views: v.views,
          };
        });
      if (rows.length) {
        await sb("vault_content", "POST", rows);
        inserted += rows.length;
      }
      console.log(`${niche}: saved ${rows.length} items`);
    } catch (e) {
      console.error(`${niche} failed:`, e.message);
    }
  }

  // Older batches are no longer "new"
  if (inserted) await sb(`vault_content?month_batch=neq.${month}&is_new=eq.true`, "PATCH", { is_new: false });

  // Real "common thread": classify every title, count in code
  try {
    if (allTitles.length) await saveInsight(month, allTitles);
  } catch (e) {
    console.error("Insight failed:", e.message);
  }

  console.log(`Done. ${inserted} items saved for ${month}.`);
};

// ---------- YouTube ----------
async function topVideos(query) {
  const apiKey = env("YOUTUBE_API_KEY");
  const after = new Date(Date.now() - 30 * 86400000).toISOString();
  const s = new URL("https://www.googleapis.com/youtube/v3/search");
  s.search = new URLSearchParams({
    part: "snippet", q: query, type: "video", order: "viewCount",
    publishedAfter: after, maxResults: "50", regionCode: "US",
    relevanceLanguage: "en", safeSearch: "strict", key: apiKey,
  });
  const sr = await (await fetch(s)).json();
  if (sr.error) throw new Error("YouTube search: " + sr.error.message);
  const ids = (sr.items || []).map((i) => i.id.videoId).filter(Boolean);
  if (!ids.length) return [];

  const v = new URL("https://www.googleapis.com/youtube/v3/videos");
  v.search = new URLSearchParams({ part: "snippet,statistics", id: ids.join(","), key: apiKey });
  const vr = await (await fetch(v)).json();
  if (vr.error) throw new Error("YouTube videos: " + vr.error.message);
  return (vr.items || [])
    .map((x) => ({ id: x.id, title: decode(x.snippet.title), views: Number(x.statistics.viewCount || 0) }))
    .sort((a, b) => b.views - a.views);
}

function decode(s) {
  return s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

// ---------- Claude ----------
async function claude(system, user, maxTokens) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env("ANTHROPIC_API_KEY"),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Claude: " + (data.error?.message || res.status));
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  return text.replace(/```json|```/g, "").trim();
}

async function generateForNiche(niche, videos) {
  const list = videos.map((v, i) => `${i}. [${v.views.toLocaleString()} views] ${v.title}`).join("\n");
  const system =
    "You are a short-form content strategist for creators. You study what is actually performing and write original content modeled on it. " +
    "Never copy a title word for word. Never use em dashes. Respond with only valid JSON, no preamble.";
  const user =
    `Niche: ${niche}\nThese are the most-viewed YouTube videos in this niche from the last 30 days:\n${list}\n\n` +
    `Write ${PER_NICHE.hook} hooks, ${PER_NICHE.idea} video ideas and ${PER_NICHE.cta} CTAs for creators in this niche, ` +
    `each modeled on the angle of one of the videos above. Hooks are spoken first lines in double quotes. Ideas are one sentence. ` +
    `CTAs are spoken closing lines in double quotes. Favor the highest-viewed videos.\n\n` +
    `Return JSON only: {"items":[{"type":"hook"|"idea"|"cta","text":"...","source":<index of the video it is modeled on>}]}`;
  const out = await claude(system, user, 8000);
  const parsed = JSON.parse(out);
  return (parsed.items || []).map((it) => ({ ...it, source: Number(it.source) }));
}

async function saveInsight(month, titles) {
  const codes = Object.entries(PATTERNS).map(([k, p]) => `${k} = ${p.label}`).join("\n");
  const list = titles.map((t, i) => `${i}. ${t.title}`).join("\n");
  const out = await claude(
    "You classify video titles. Respond with only valid JSON, no preamble.",
    `Classify each title into the single best-fitting pattern:\n${codes}\nG = Other\n\nTitles:\n${list}\n\n` +
      `Return JSON only: {"labels":"<one letter per title, in order, no spaces>"}`,
    2000
  );
  const labels = (JSON.parse(out).labels || "").replace(/[^A-G]/g, "");
  if (labels.length < titles.length * 0.9) throw new Error("Label count mismatch");

  const counts = {};
  const nicheTop = {};
  titles.forEach((t, i) => {
    const l = labels[i];
    if (!l || l === "G") return;
    counts[l] = (counts[l] || 0) + 1;
    nicheTop[t.niche] = nicheTop[t.niche] || {};
    nicheTop[t.niche][l] = (nicheTop[t.niche][l] || 0) + 1;
  });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!top) return;
  const [code, n] = top;
  const p = PATTERNS[code];
  const pct = Math.round((n / titles.length) * 100);
  const nichesLed = Object.values(nicheTop).filter(
    (c) => Object.entries(c).sort((a, b) => b[1] - a[1])[0][0] === code
  ).length;
  const nicheCount = Object.keys(nicheTop).length;
  const spread = nichesLed === nicheCount ? "across every niche" : `in ${nichesLed} of ${nicheCount} niches`;

  const body = `${p.label} titles made up ${pct}% of the ${titles.length} most-viewed videos we tracked this month and led ${spread}. ${p.tip}`;
  await sb(`vault_insights?month_batch=eq.${month}`, "DELETE");
  await sb("vault_insights", "POST", {
    month_batch: month, title: p.quote, body, pattern: p.label,
    pattern_pct: pct, niches_led: nichesLed, sample_size: titles.length,
  });
  console.log("Insight:", body);
}

// ---------- Supabase (service key, bypasses read-only lock) ----------
async function sb(path, method, body) {
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  const headers = { apikey: key, "content-type": "application/json", Prefer: "return=minimal" };
  if (!key.startsWith("sb_")) headers.Authorization = `Bearer ${key}`;
  const res = await fetch(`${env("SUPABASE_URL")}/rest/v1/${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${path}: ${res.status} ${await res.text()}`);
}

export const config = { background: true };
