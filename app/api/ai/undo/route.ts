import { requireUser } from "@/lib/auth";
import { ok, bad, handle } from "@/lib/http";
import { undoBatch } from "@/lib/ai/apply-mutations";
import { computeRisk } from "@/lib/ai/risk";

export const POST = handle(async (req: Request) => {
  await requireUser();
  const { projectId, batchId } = await req.json();
  if (!projectId || !batchId) return bad("projectId and batchId are required");
  const result = await undoBatch(projectId, batchId);
  const risk = await computeRisk(projectId);
  return ok({ ...result, risk });
});
