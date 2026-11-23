// Vercel serverless function: POST /api/ask { system, prompt } -> { text }
// Set ANTHROPIC_API_KEY in Vercel > Project > Settings > Environment Variables.
// Without a key it returns mock answers.
import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { system = "", prompt = "", who = "?" } = req.body || {};

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.json({ text: `(mock ${who}) I would answer here. Add ANTHROPIC_API_KEY in Vercel to get real agents.`, mock: true });
  }
  try {
    const client = new Anthropic();
    const r = await client.messages.create({
      model: process.env.MODEL || "claude-sonnet-4-5",
      max_tokens: 400,
      system: String(system).slice(0, 2000),
      messages: [{ role: "user", content: String(prompt).slice(0, 12000) }],
    });
    res.json({ text: r.content[0].text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
