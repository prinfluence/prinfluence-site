// Scheduled function: on the 1st of every month, starts the vault refresh.
// Cron runs in UTC: "0 10 1 * *" = 10:00 UTC on the 1st (6 AM ET in summer, 5 AM ET in winter).
// You can also run it any time from Netlify: Logs > Functions > refresh-vault-monthly > Run now.

const env = (k) => (globalThis.Netlify ? Netlify.env.get(k) : process.env[k]);

export default async () => {
  const site = (env("SITE_URL") || "https://www.prinfluence.com").replace(/\/$/, "");
  const res = await fetch(`${site}/.netlify/functions/refresh-vault-background`, {
    method: "POST",
    headers: { "x-refresh-key": env("SUPABASE_SERVICE_ROLE_KEY") },
  });
  console.log("Vault refresh started:", res.status);
};

export const config = { schedule: "0 10 1 * *" };
