import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

// Demo auth: a signed session would go here. For the hackathon we store the
// user id in an httpOnly cookie set by /api/auth/demo. Swapping in real JWT
// later means changing only this file + the login route.
export const SESSION_COOKIE = "pp_session";

export async function getCurrentUser() {
  const id = cookies().get(SESSION_COOKIE)?.value;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}
