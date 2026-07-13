import { GoogleGenerativeAI } from "@google/generative-ai";

// Fail fast at startup if the key is missing rather than at the first request.
if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY is not set. Add it to your .env file. " +
    "Get a free key at https://aistudio.google.com/app/apikey"
  );
}

// Single GoogleGenerativeAI client reused across requests (safe — it holds no
// per-request state, only the API key).
//
// The non-null assertion (!) is required here: TypeScript types process.env
// values as string | undefined even after a truthy guard, because it cannot
// narrow across module scope. The guard above guarantees the value is a
// non-empty string at this point.
export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// The model name in one place. gemini-2.0-flash is the current stable fast
// production model. If Google releases gemini-2.5-flash as stable, change
// only this string.
export const AI_MODEL_NAME = "gemini-2.0-flash";
