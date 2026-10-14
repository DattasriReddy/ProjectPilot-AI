/**
 * Standalone Groq API test — run before testing the full replan feature.
 *
 * Usage (PowerShell):
 *   $env:GROQ_API_KEY="gsk_..."; node test-groq.mjs
 *
 * Usage (bash):
 *   GROQ_API_KEY="gsk_..." node test-groq.mjs
 */

import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.error("ERROR: GROQ_API_KEY is not set.");
  console.error('Set it: $env:GROQ_API_KEY="gsk_..."; node test-groq.mjs');
  process.exit(1);
}

console.log(`Using key: ${apiKey.slice(0, 8)}... (${apiKey.length} chars total)\n`);

const groq = new Groq({ apiKey });

// ── Step 1: List all models this key can actually see ──────────────────────
console.log("Step 1: Fetching models available to your key...");
let availableModels = [];
try {
  const list = await groq.models.list();
  availableModels = list.data.map((m) => m.id).sort();
  console.log(`Found ${availableModels.length} models:\n`);
  for (const id of availableModels) {
    console.log(`  ${id}`);
  }
} catch (e) {
  console.error("Could not list models:", e?.message ?? String(e));
  process.exit(1);
}

// ── Step 2: Try chat completions on models that look like chat models ───────
console.log("\nStep 2: Testing chat completions...\n");

// Filter to likely chat models (exclude whisper, tts, guard, etc.)
const chatCandidates = availableModels.filter(
  (id) =>
    !id.includes("whisper") &&
    !id.includes("tts") &&
    !id.includes("guard") &&
    !id.includes("orpheus")
);

let workingModel = null;

for (const model of chatCandidates) {
  process.stdout.write(`  ${model.padEnd(45)} `);
  try {
    const response = await groq.chat.completions.create({
      model,
      messages: [{ role: "user", content: "Reply only with the word Hello." }],
      temperature: 0,
      max_tokens: 10,
    });
    const text = response.choices[0]?.message?.content ?? "";
    console.log(`✓  "${text.trim()}"`);
    if (!workingModel) workingModel = model;
  } catch (e) {
    const msg = e?.message ?? String(e);
    const code = msg.match(/\b(4\d\d|5\d\d)\b/)?.[0] ?? "ERR";
    console.log(`✗ ${code}`);
  }
}

console.log("");
if (workingModel) {
  console.log("════════════════════════════════════════════════════");
  console.log(`✅  Use this model: "${workingModel}"`);
  console.log("");
  console.log("Open  lib/ai/config.ts  and change the last line to:");
  console.log(`  export const AI_MODEL_NAME = "${workingModel}";`);
  console.log("════════════════════════════════════════════════════");
} else {
  console.log("════════════════════════════════════════════════════");
  console.log("❌  No working chat model found.");
  console.log("    Paste the full output above here so we can debug.");
  console.log("════════════════════════════════════════════════════");
  process.exit(1);
}
