// Tiny client-side fetch wrapper. Throws on non-2xx with the server message.
async function req(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  demoLogin: () => req("/api/auth/demo", { method: "POST" }),
  patchTask: (id: string, body: any) =>
    req(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  createTask: (body: any) =>
    req("/api/tasks", { method: "POST", body: JSON.stringify(body) }),
  replan: (projectId: string, command: string) =>
    req("/api/ai/replan", { method: "POST", body: JSON.stringify({ projectId, command }) }),
  apply: (projectId: string, plan: any) =>
    req("/api/ai/apply", { method: "POST", body: JSON.stringify({ projectId, plan }) }),
  undo: (projectId: string, batchId: string) =>
    req("/api/ai/undo", { method: "POST", body: JSON.stringify({ projectId, batchId }) }),
};
