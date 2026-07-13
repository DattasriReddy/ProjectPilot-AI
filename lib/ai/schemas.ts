import { z } from "zod";
import { TASK_STATUSES, PRIORITIES } from "@/lib/constants";

// ---------------------------------------------------------------------------
// What the model is allowed to emit. We keep ONE flat mutation shape with an
// `action` discriminator rather than a zod discriminatedUnion, because a flat
// object translates more reliably into the JSON schema the model is
// constrained to. Per-action required fields are enforced afterwards in
// validateAgainstBoard() — that's the safety gate the diagram calls out.
// ---------------------------------------------------------------------------

export const mutationSchema = z.object({
  action: z.enum(["create", "update", "move", "flag"]),
  // create + update
  title: z.string().nullable().optional(),
  detail: z.string().nullable().optional(),
  priority: z.enum(PRIORITIES).nullable().optional(),
  dueInDays: z.number().int().nullable().optional(), // relative to today; app converts to a date
  // create
  status: z.enum(TASK_STATUSES).nullable().optional(),
  // update + move + flag
  taskId: z.string().nullable().optional(),
  // move
  toStatus: z.enum(TASK_STATUSES).nullable().optional(),
  // flag
  severity: z.enum(["low", "medium", "high"]).nullable().optional(),
  note: z.string().nullable().optional(),
  // always
  reasoning: z.string().min(1),
});

export type Mutation = z.infer<typeof mutationSchema>;

export const replanSchema = z.object({
  summary: z.string().min(1), // one-line plan summary shown at the top of the panel
  mutations: z.array(mutationSchema).min(1).max(25),
});

export type ReplanPlan = z.infer<typeof replanSchema>;

// A compact view of the board we hand to the model and validate against.
export type BoardTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee: string | null;
  dueDate: string | null;
  blockedById: string | null;
};

export type BoardSnapshot = {
  projectName: string;
  today: string;
  tasks: BoardTask[];
};

// ---------------------------------------------------------------------------
// Referential validation: does this plan actually make sense for THIS board?
// Runs after zod parsing, before anything touches the database.
// ---------------------------------------------------------------------------
export function validateAgainstBoard(
  plan: ReplanPlan,
  board: BoardSnapshot
): { ok: true } | { ok: false; errors: string[] } {
  const ids = new Set(board.tasks.map((t) => t.id));
  const errors: string[] = [];

  plan.mutations.forEach((m, i) => {
    const at = `mutation[${i}] (${m.action})`;
    if (m.action === "create") {
      if (!m.title) errors.push(`${at}: create requires a title`);
    } else if (m.action === "update") {
      if (!m.taskId || !ids.has(m.taskId))
        errors.push(`${at}: update targets unknown taskId "${m.taskId}"`);
    } else if (m.action === "move") {
      if (!m.taskId || !ids.has(m.taskId))
        errors.push(`${at}: move targets unknown taskId "${m.taskId}"`);
      if (!m.toStatus) errors.push(`${at}: move requires toStatus`);
    } else if (m.action === "flag") {
      if (m.taskId && !ids.has(m.taskId))
        errors.push(`${at}: flag targets unknown taskId "${m.taskId}"`);
      if (!m.note) errors.push(`${at}: flag requires a note`);
    }
  });

  return errors.length ? { ok: false, errors } : { ok: true };
}
