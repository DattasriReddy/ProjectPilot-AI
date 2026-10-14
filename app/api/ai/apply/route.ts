import { requireUser } from "@/lib/auth";
import { ok, bad, handle } from "@/lib/http";
import { buildBoardSnapshot } from "@/lib/ai/board";
import { replanSchema, validateAgainstBoard } from "@/lib/ai/schemas";
import { applyPlan } from "@/lib/ai/apply-mutations";
import { computeRisk } from "@/lib/ai/risk";

// COMMIT: re-validate the (client-echoed) plan against the live board, then
// apply it in a transaction. Re-validation here is deliberate — never trust
// that the board hasn't changed since the plan was proposed.
export const POST = handle(async (req: Request) => {
  await requireUser();
  const { projectId, plan } = await req.json();
  if (!projectId || !plan) return bad("projectId and plan are required");

  const parsed = replanSchema.safeParse(plan);
  if (!parsed.success) return bad("Malformed plan", 422);

  const board = await buildBoardSnapshot(projectId);
  const check = validateAgainstBoard(parsed.data, board);
  if (!check.ok) return bad(`Plan no longer valid: ${check.errors.join("; ")}`, 422);

  const result = await applyPlan(projectId, parsed.data);
  const risk = await computeRisk(projectId);
  return ok({ ...result, risk });
});
