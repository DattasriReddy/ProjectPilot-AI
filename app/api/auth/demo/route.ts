import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/auth";
import { ok, bad, handle } from "@/lib/http";

// Demo sign-in: sets the session cookie to the seeded demo user.
export const POST = handle(async () => {
  const user = await prisma.user.findFirst({ where: { email: "demo@projectpilot.ai" } });
  if (!user) return bad("Demo user not found — run `npm run db:seed`", 404);
  cookies().set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return ok({ user: { id: user.id, name: user.name } });
});
