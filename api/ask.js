// Vercel serverless function: POST /api/ask { system, prompt } -> { text }
// Uses Google Gemini (free tier, no credit card).
// Get a key at https://aistudio.google.com/apikey and add it in
// Vercel > Settings > Environment Variables as GEMINI_API_KEY.
// Without a key it returns mock answers.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { system = "", prompt = "", who = "?" } = req.body || {};
  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    return res.json({ text: `(mock ${who}) I would answer here. Add GEMINI_API_KEY in Vercel to get real agents.`, mock: true });
  }

  const model = process.env.MODEL || "gemini-flash-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: String(system).slice(0, 2000) }] },
    contents: [{ role: "user", parts: [{ text: String(prompt).slice(0, 12000) }] }],
  });
  const call = (auth) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...auth }, body });
  try {
    // Try the key as an API key; if Google rejects it, retry it as a Bearer token.
    let r = await call({ "x-goog-api-key": key });
    if (r.status === 400 || r.status === 401 || r.status === 403) {
      const r2 = await call({ Authorization: `Bearer ${key}` });
      if (r2.ok) r = r2;
    }
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || "Gemini error" });
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "(no answer)";
    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
