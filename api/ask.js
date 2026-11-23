// Vercel serverless function: POST /api/ask { system, prompt } -> { text }
// Uses Google Gemini (free tier, no credit card).
// Get a key at https://aistudio.google.com/apikey and add it in
// Vercel > Settings > Environment Variables as GEMINI_API_KEY.
// Without a key it returns mock answers.

// Models to try in order. If one is busy/overloaded or doesn't exist, the next is tried.
const MODELS = [
  process.env.MODEL,
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
].filter(Boolean);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { system = "", prompt = "", who = "?" } = req.body || {};
  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    return res.json({ text: `(mock ${who}) I would answer here. Add GEMINI_API_KEY in Vercel to get real agents.`, mock: true });
  }

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: String(system).slice(0, 2000) }] },
    contents: [{ role: "user", parts: [{ text: String(prompt).slice(0, 12000) }] }],
  });

  let authHeader = { "x-goog-api-key": key };
  let lastError = "Unknown error";

  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        let r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...authHeader }, body });

        // New-style keys: retry as Bearer token if the API-key header is rejected.
        if ((r.status === 401 || r.status === 403) && !authHeader.Authorization) {
          const bearer = { Authorization: `Bearer ${key}` };
          const r2 = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...bearer }, body });
          if (r2.ok || r2.status === 503 || r2.status === 429) { authHeader = bearer; r = r2; }
        }

        const data = await r.json();
        if (r.ok) {
          const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "(no answer)";
          return res.json({ text, model });
        }
        lastError = data.error?.message || `HTTP ${r.status}`;

        if (r.status === 503 || r.status === 500) { await sleep(1500); continue; } // busy: retry once, then next model
        if (r.status === 404 || r.status === 429) break;                          // missing or quota: next model
        return res.status(r.status).json({ error: lastError });                   // other errors (bad key etc.)
      } catch (e) {
        lastError = e.message;
      }
    }
  }
  res.status(503).json({ error: "All Gemini models are busy right now. Wait a minute and try again. (" + lastError + ")" });
}
