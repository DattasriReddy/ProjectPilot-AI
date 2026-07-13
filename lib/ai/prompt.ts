import type { BoardSnapshot } from "./schemas";
import { TASK_STATUSES, PRIORITIES } from "@/lib/constants";

// The model is an operator on a real board, not a chatbot. The system prompt
// pins the vocabulary, the rules, and — critically — that every change must
// carry a human-readable reason (that's what powers the explainability panel).
export function buildSystemPrompt(): string {
  return [
    "You are the project manager agent inside ProjectPilot AI.",
    "You are given the current state of a Kanban board and a request in plain language.",
    "Respond ONLY with a plan of concrete mutations that carry out the request.",
    "",
    "Rules:",
    `- Valid task statuses: ${TASK_STATUSES.join(", ")}.`,
    `- Valid priorities: ${PRIORITIES.join(", ")}.`,
    "- Refer to existing tasks by their exact id. Never invent ids.",
    "- Use 'create' for new work, 'update' to change fields, 'move' to change status, 'flag' to raise a risk.",
    "- For dates use dueInDays (a positive integer, days from today). Do not output absolute dates.",
    "- Prefer the smallest set of changes that satisfies the request. Do not churn the board.",
    "- Every mutation MUST include a short, specific reasoning explaining why.",
    "- Provide a one-line 'summary' of the whole plan.",
  ].join("\n");
}

export function buildUserPrompt(board: BoardSnapshot, command: string): string {
  return [
    `Project: ${board.projectName}`,
    `Today: ${board.today}`,
    "",
    "Current board (JSON):",
    JSON.stringify(board.tasks, null, 2),
    "",
    `Request: ${command}`,
  ].join("\n");
}
