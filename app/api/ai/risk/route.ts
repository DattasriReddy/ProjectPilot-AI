export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth";
import { ok, bad, handle } from "@/lib/http";
import { computeRisk } from "@/lib/ai/risk";

export const GET = handle(async (req: Request) => {
  await requireUser();
  const projectId = new URL(req.url).searchParams.get("projectId");
  if (!projectId) return bad("projectId is required");
  const risk = await computeRisk(projectId);
  return ok({ risk });
});
