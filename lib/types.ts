// Shared client-side shapes (a trimmed mirror of the Prisma models).
export type Task = {
  id: string;
  title: string;
  detail: string | null;
  status: string;
  priority: string;
  order: number;
  dueDate: string | null;
  assignee?: { id: string; name: string } | null;
  blockedById: string | null;
};

export type RiskFactor = { label: string; weight: number };
export type Risk = { score: number; level: string; factors: RiskFactor[] } | null;

export type ProjectFull = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  deadline: string | null;
  tasks: Task[];
  risk: Risk;
};

// The AI plan the replan endpoint returns.
export type Mutation = {
  action: "create" | "update" | "move" | "flag";
  taskId?: string | null;
  title?: string | null;
  toStatus?: string | null;
  status?: string | null;
  priority?: string | null;
  dueInDays?: number | null;
  severity?: string | null;
  note?: string | null;
  reasoning: string;
};
export type Plan = { summary: string; mutations: Mutation[] };
