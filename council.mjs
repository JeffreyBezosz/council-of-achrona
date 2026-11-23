// The Council of Achrona: minimal multi-agent prototype
// Run:  npm i @anthropic-ai/sdk   then   ANTHROPIC_API_KEY=... node council.mjs
// No key? It runs in MOCK mode so you can see the flow.

import Anthropic from "@anthropic-ai/sdk";

const MOCK = !process.env.ANTHROPIC_API_KEY;
const client = MOCK ? null : new Anthropic();
const MODEL = "claude-sonnet-4-5"; // swap for whatever model you have access to

// 1. DISTRIBUTED KNOWLEDGE: each agent only sees its own fragments
const FRAGMENTS = {
  Archivist: [
    "Log 0417: memory archive checksums began failing at 03:12.",
    "The backup crystal in the north vault was last verified 40 days ago.",
  ],
  Engineer: [
    "Power grid spike of 300% recorded at 03:10 in sector 7.",
    "Sync daemon 'Chronos' auto-updated at 03:09 without approval.",
  ],
  Oracle: [
    "Citizens report dreams from 'tomorrow', a sign of time desync.",
    "Ancient texts warn: 'Never restore before the clock is stilled.'",
  ],
};

// 2. AGENTS: name + personality/role (system prompt)
const AGENTS = {
  Archivist: "You are the Archivist of Achrona: precise, data-driven, cares about preserving memory.",
  Engineer: "You are the Engineer of Achrona: pragmatic, focuses on systems, root causes and fast fixes.",
  Oracle: "You are the Oracle of Achrona: cautious, thinks about long-term risk and hidden causes.",
};

async function ask(system, prompt, who = "?") {
  if (MOCK) return `[mock ${who}] (would answer: ${prompt.slice(0, 60)}...)`;
  const res = await client.messages.create({
    model: MODEL, max_tokens: 400, system,
    messages: [{ role: "user", content: prompt }],
  });
  return res.content[0].text;
}

const transcript = []; // shared "blackboard" every agent can read
const log = (who, text) => { transcript.push(`${who}: ${text}`); console.log(`\n--- ${who} ---\n${text}`); };

async function main() {
  console.log(MOCK ? "(MOCK MODE, set ANTHROPIC_API_KEY for real agents)\n" : "");

  // ROUND 1: analyze own knowledge (in parallel)
  console.log("\n===== ROUND 1: ANALYSIS =====");
  const r1 = await Promise.all(Object.entries(AGENTS).map(([name, sys]) =>
    ask(sys, `The Desync shattered Achrona. Your private knowledge:\n- ${FRAGMENTS[name].join("\n- ")}\n\nShare what you know and your hypothesis for the cause. Max 4 sentences.`, name)
      .then(t => [name, t])));
  r1.forEach(([n, t]) => log(n, t));

  // ROUND 2: debate, each agent reads the others and pushes back
  console.log("\n===== ROUND 2: DEBATE =====");
  for (const [name, sys] of Object.entries(AGENTS)) {
    const t = await ask(sys, `Council transcript so far:\n${transcript.join("\n")}\n\nRespond to the others. Challenge one claim, agree with one, and update your hypothesis. Max 4 sentences.`, name);
    log(name, t);
  }

  // ROUND 3: options + vote
  console.log("\n===== ROUND 3: VOTE =====");
  const options = ["A) Restore memories from backup crystal immediately",
                   "B) First roll back / stop the Chronos daemon, then restore",
                   "C) Rebuild memory from citizen dreams"];
  for (const [name, sys] of Object.entries(AGENTS)) {
    const t = await ask(sys, `Transcript:\n${transcript.join("\n")}\n\nOptions:\n${options.join("\n")}\nVote for ONE option. Start your answer with the letter, then one sentence why.`, name);
    log(name, t);
  }

  // ROUND 4: orchestrator writes the recovery plan
  console.log("\n===== RECOVERY PLAN =====");
  const plan = await ask(
    "You are the Chair of the Council. Neutral, decisive. You summarize debates into action.",
    `Full transcript:\n${transcript.join("\n")}\n\nTally the votes, name the root cause, and write a numbered 5-step recovery plan for Achrona.`, "Chair");
  log("Chair", plan);
}

main();
