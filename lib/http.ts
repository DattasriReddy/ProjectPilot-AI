import { NextResponse } from "next/server";

export const ok = (data: unknown, init?: number) =>
  NextResponse.json(data, { status: init ?? 200 });

export const bad = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

// Wrap a handler so thrown errors become clean JSON instead of stack traces.
export function handle<T extends any[]>(
  fn: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (e: any) {
      if (e?.message === "UNAUTHENTICATED") return bad("Not signed in", 401);
      console.error(e);
      return bad(e?.message ?? "Server error", 500);
    }
  };
}
