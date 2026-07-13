import { requireUser } from "@/lib/auth";
import { ok, bad, handle } from "@/lib/http";
import { buildBoardSnapshot } from "@/lib/ai/board";
import { generatePlan, ReplanError } from "@/lib/ai/replan";

// PROPOSE: build context -> model -> validate. Returns a plan but writes
// NOTHING to the board. The client shows it; /ai/apply commits it.
export const POST = handle(async (req: Request) => {
  await requireUser();
  const { projectId, command } = await req.json();
  if (!projectId || !command) return bad("projectId and command are required");

  const board = await buildBoardSnapshot(projectId);
  try {
    const plan = await generatePlan(board, command);
    return ok({ plan });
  } catch (e) {
    if (e instanceof ReplanError) {
      return bad(`${e.message}: ${e.details?.join("; ")}`, 422);
    }
    throw e;
  }
});
