// Client-side fetch wrapper. Throws on non-2xx with the server error message.
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
  // Auth
  demoLogin: () => req("/api/auth/demo", { method: "POST" }),

  // Projects
  getProjects: () => req("/api/projects"),
  createProject: (body: { name: string; description?: string; priority?: string; deadline?: string | null }) =>
    req("/api/projects", { method: "POST", body: JSON.stringify(body) }),
  getProject: (id: string) => req(`/api/projects/${id}`),
  updateProject: (id: string, body: Partial<{ name: string; description: string; status: string; priority: string; deadline: string | null }>) =>
    req(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteProject: (id: string) =>
    req(`/api/projects/${id}`, { method: "DELETE" }),

  // Tasks
  createTask: (body: { projectId: string; title: string; detail?: string; status?: string; priority?: string; assigneeId?: string; dueDate?: string | null }) =>
    req("/api/tasks", { method: "POST", body: JSON.stringify(body) }),
  patchTask: (id: string, body: Record<string, unknown>) =>
    req(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteTask: (id: string) =>
    req(`/api/tasks/${id}`, { method: "DELETE" }),

  // Comments
  getComments: (taskId: string) => req(`/api/comments?taskId=${taskId}`),
  addComment: (taskId: string, body: string) =>
    req("/api/comments", { method: "POST", body: JSON.stringify({ taskId, body }) }),

  // AI
  replan: (projectId: string, command: string) =>
    req("/api/ai/replan", { method: "POST", body: JSON.stringify({ projectId, command }) }),
  apply: (projectId: string, plan: unknown) =>
    req("/api/ai/apply", { method: "POST", body: JSON.stringify({ projectId, plan }) }),
  undo: (projectId: string, batchId: string) =>
    req("/api/ai/undo", { method: "POST", body: JSON.stringify({ projectId, batchId }) }),
  getAiHistory: (projectId: string) => req(`/api/ai/history?projectId=${projectId}`),
  getRisk: (projectId: string) => req(`/api/ai/risk?projectId=${projectId}`),
};
