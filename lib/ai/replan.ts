import { genAI, AI_MODEL_NAME } from "./config";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import {
  replanSchema,
  validateAgainstBoard,
  type BoardSnapshot,
  type ReplanPlan,
} from "./schemas";

export class ReplanError extends Error {
  constructor(message: string, public details?: string[]) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// How this works (replacing Vercel AI SDK's generateObject):
//
// We ask Gemini to respond in JSON mode (responseMimeType: "application/json")
// and describe the exact shape we want in the prompt. Gemini returns a JSON
// string. We parse it with JSON.parse, then validate it with Zod — the same
// Zod schemas that existed before. Nothing downstream changes.
//
// The Anthropic version used generateObject(), which did the same three steps
// internally: prompt the model, parse JSON, validate schema. We are just doing
// those three steps explicitly here.
// ---------------------------------------------------------------------------

// Build a human-readable JSON schema description for the prompt so the model
// knows exactly what shape to emit. This replaces the Zod→JSON Schema
// conversion that the Vercel AI SDK did automatically.
function buildJsonSchemaDescription(): string {
  return `
You must respond with a single valid JSON object matching this exact structure:

{
  "summary": "<one-line description of the overall plan>",
  "mutations": [
    {
      "action": "create" | "update" | "move" | "flag",
      "reasoning": "<why this change is being made — required on every mutation>",

      // For action = "create":
      "title": "<task title>",
      "detail": "<optional description>",
      "status": "todo" | "in_progress" | "review" | "done",
      "priority": "low" | "medium" | "high",
      "dueInDays": <positive integer, days from today> | null,

      // For action = "update":
      "taskId": "<exact id from the board>",
      "title": "<new title>" | null,
      "detail": "<new description>" | null,
      "priority": "low" | "medium" | "high" | null,
      "dueInDays": <positive integer> | null,

      // For action = "move":
      "taskId": "<exact id from the board>",
      "toStatus": "todo" | "in_progress" | "review" | "done",

      // For action = "flag":
      "taskId": "<exact id from the board>" | null,
      "note": "<description of the risk>",
      "severity": "low" | "medium" | "high"
    }
  ]
}

Do not include any text outside the JSON object. Do not wrap it in markdown code fences.
`.trim();
}

// One call to Gemini. Returns a parsed and Zod-validated plan, or throws.
async function callGemini(
  board: BoardSnapshot,
  command: string,
  extraNote?: string
): Promise<ReplanPlan> {
  const model = genAI.getGenerativeModel({
    model: AI_MODEL_NAME,
    // JSON mode: Gemini guarantees the response is valid JSON.
    generationConfig: { responseMimeType: "application/json" },
    // System instruction: Gemini's equivalent of a system prompt.
    systemInstruction: buildSystemPrompt(),
  });

  const userPrompt =
    buildUserPrompt(board, command) +
    "\n\n" +
    buildJsonSchemaDescription() +
    (extraNote ? `\n\nYour previous attempt was invalid:\n${extraNote}\nFix it.` : "");

  let responseText: string;
  try {
    const result = await model.generateContent(userPrompt);
    responseText = result.response.text();
  } catch (e: any) {
    // Translate Gemini SDK errors into messages that are useful for the user.
    const msg: string = e?.message ?? String(e);
    if (msg.includes("API_KEY_INVALID") || msg.includes("API key not valid")) {
      throw new ReplanError("Invalid Gemini API key. Check GEMINI_API_KEY in your .env file.");
    }
    if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429")) {
      throw new ReplanError("Gemini rate limit reached. Wait a moment and try again.");
    }
    if (msg.includes("fetch") || msg.includes("ENOTFOUND") || msg.includes("ECONNREFUSED")) {
      throw new ReplanError("Could not reach the Gemini API. Check your internet connection.");
    }
    throw new ReplanError(`Gemini API error: ${msg}`);
  }

  // Parse the JSON string Gemini returned.
  let raw: unknown;
  try {
    raw = JSON.parse(responseText);
  } catch {
    throw new ReplanError("Gemini returned invalid JSON. This is rare — try again.");
  }

  // Validate the parsed object against our Zod schema.
  const parsed = replanSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    throw new ReplanError("Gemini response did not match the expected shape", issues);
  }

  return parsed.data;
}

// Step 3–4 of the loop: call the model, validate against the board. On a
// referential failure we give the model exactly one repair attempt with the
// errors fed back. This logic is identical to the Anthropic version.
export async function generatePlan(
  board: BoardSnapshot,
  command: string
): Promise<ReplanPlan> {
  let plan = await callGemini(board, command);
  let check = validateAgainstBoard(plan, board);

  if (!check.ok) {
    plan = await callGemini(board, command, check.errors.join("\n"));
    check = validateAgainstBoard(plan, board);
    if (!check.ok) {
      throw new ReplanError("The AI plan failed validation after two attempts", check.errors);
    }
  }

  return plan;
}
