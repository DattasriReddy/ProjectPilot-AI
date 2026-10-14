import { groqClient, AI_MODEL_NAME } from "./config";
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
// How this works:
//
// We call Groq's OpenAI-compatible chat completions endpoint with
// response_format: { type: "json_object" } so the model is forced to return
// valid JSON. We describe the exact shape we want in the prompt.
// The returned JSON string is parsed and validated with the same Zod schemas
// that existed before — nothing downstream changes.
//
// SDK: groq-sdk (OpenAI-compatible)
//   - Client:   new Groq({ apiKey })
//   - Call:     groqClient.chat.completions.create({ model, messages, response_format })
//   - Response: response.choices[0].message.content  ← a string
// ---------------------------------------------------------------------------

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

// One call to Groq. Returns a parsed and Zod-validated plan, or throws.
async function callGroq(
  board: BoardSnapshot,
  command: string,
  extraNote?: string
): Promise<ReplanPlan> {
  const userPrompt =
    buildUserPrompt(board, command) +
    "\n\n" +
    buildJsonSchemaDescription() +
    (extraNote ? `\n\nYour previous attempt was invalid:\n${extraNote}\nFix it.` : "");

  let responseText: string;
  try {
    const response = await groqClient.chat.completions.create({
      model: AI_MODEL_NAME,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: userPrompt },
      ],
      // JSON object mode: Groq guarantees the response is valid JSON.
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    responseText = response.choices[0]?.message?.content ?? "";
  } catch (e: any) {
    const msg: string = e?.message ?? String(e);
    if (msg.includes("401") || msg.includes("invalid_api_key") || msg.includes("Unauthorized")) {
      throw new ReplanError("Invalid Groq API key. Check GROQ_API_KEY in your .env file.");
    }
    if (msg.includes("429") || msg.includes("rate_limit") || msg.includes("RESOURCE_EXHAUSTED")) {
      throw new ReplanError("Groq rate limit reached. Wait a moment and try again.");
    }
    if (msg.includes("503") || msg.includes("unavailable") || msg.includes("overloaded")) {
      throw new ReplanError("Groq is temporarily overloaded. Wait a moment and try again.");
    }
    if (msg.includes("fetch") || msg.includes("ENOTFOUND") || msg.includes("ECONNREFUSED")) {
      throw new ReplanError("Could not reach the Groq API. Check your internet connection.");
    }
    throw new ReplanError(`Groq API error: ${msg}`);
  }

  // Parse the JSON string Groq returned.
  let raw: unknown;
  try {
    raw = JSON.parse(responseText);
  } catch {
    throw new ReplanError("Groq returned invalid JSON. This is rare — try again.");
  }

  // Validate the parsed object against our Zod schema.
  const parsed = replanSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    throw new ReplanError("Groq response did not match the expected shape", issues);
  }

  return parsed.data;
}

// Call the model, validate against the board. On a referential failure, give
// the model exactly one repair attempt with the errors fed back.
export async function generatePlan(
  board: BoardSnapshot,
  command: string
): Promise<ReplanPlan> {
  let plan = await callGroq(board, command);
  let check = validateAgainstBoard(plan, board);

  if (!check.ok) {
    plan = await callGroq(board, command, check.errors.join("\n"));
    check = validateAgainstBoard(plan, board);
    if (!check.ok) {
      throw new ReplanError("The AI plan failed validation after two attempts", check.errors);
    }
  }

  return plan;
}
