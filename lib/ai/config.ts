import Groq from "groq-sdk";

// Fail fast at startup if the key is missing rather than at the first request.
if (!process.env.GROQ_API_KEY) {
  throw new Error(
    "GROQ_API_KEY is not set. Add it to your .env file. " +
    "Get a free key at https://console.groq.com/keys"
  );
}

// Single Groq client reused across requests (safe — holds no per-request state).
export const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

// qwen/qwen3.8-27b: best general-purpose model available on this Groq account.
// Change only this string to switch models — nothing else references the name.
export const AI_MODEL_NAME = "qwen/qwen3.8-27b";
