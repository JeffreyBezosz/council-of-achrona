# The Council of Achrona

Prototype for the Roboest challenge at Hack The Future Antwerp: a group of AI agents that share scattered clues, debate, vote, and come up with a recovery plan for Achrona.

## How it works
1. **Scattered knowledge**: each agent (Archivist, Engineer, Oracle) only gets its own clues.
2. **Round 1, analysis**: each agent shares its clues and a guess about the cause.
3. **Round 2, debate**: each agent reads the shared transcript, challenges one claim and agrees with another.
4. **Round 3, vote**: each agent picks option A, B or C.
5. **Round 4, plan**: a neutral Chair agent counts the votes and writes a 5-step recovery plan.

Same AI model, different system prompts and different information, with the code acting as the messenger between them.

## Web version (Vercel)
`index.html` + `api/ask.js`. Add `ANTHROPIC_API_KEY` under Vercel > Settings > Environment Variables, then redeploy. Without a key it shows mock answers.

## Run it in the terminal
```bash
npm install
ANTHROPIC_API_KEY=your-key node council.mjs
```
Without a key it runs in **mock mode**, so you can still see the flow.

PowerShell: `$env:ANTHROPIC_API_KEY="your-key"; node council.mjs`

## Ideas for next steps
- Web UI with avatars around a table and speech bubbles
- Hidden role: one agent is secretly corrupted
- Tools (for example `searchArchive()`) and JSON output for votes
