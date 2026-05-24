/**
 * Tasks service — business logic for the tasks tab.
 *
 * Two distinct operations:
 *   - `createClientTask` — submission by a portal client (title/desc/due
 *     only; clientId comes from the session, status/priority defaulted).
 *   - `updateTaskWorkflow` — workflow change by admin/manager (status +
 *     priority only). Description, title, due date and links are never
 *     touched by this function.
 *
 * Shared types/enum constants live in ./task-constants so client
 * components can use them without dragging this server-only module into
 * their bundle.
 */

import "server-only";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  ne,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db";
import { clients, tasks, type Task } from "@/db/schema";
import {
  TASK_PRIORITY_VALUES,
  TASK_STATUS_VALUES,
  type ClientTaskFieldErrors,
  type ClientTaskInput,
  type TaskStatusFilter,
  type TaskWorkflowFieldErrors,
  type TaskWorkflowInput,
} from "./task-constants";

export class TaskNotFoundError extends Error {
  constructor(id: number) {
    super(`Task ${id} not found.`);
    this.name = "TaskNotFoundError";
  }
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function validateClientTaskInput(
  input: ClientTaskInput,
): ClientTaskFieldErrors {
  const errors: ClientTaskFieldErrors = {};
  if (!input.title.trim()) {
    errors.title = "Title is required.";
  } else if (input.title.length > 255) {
    errors.title = "Title must be at most 255 characters.";
  }
  if (input.dueDate && !DATE_REGEX.test(input.dueDate)) {
    errors.dueDate = "Use the YYYY-MM-DD format.";
  }
  return errors;
}

export function validateTaskWorkflowInput(
  input: TaskWorkflowInput,
): TaskWorkflowFieldErrors {
  const errors: TaskWorkflowFieldErrors = {};
  if (!TASK_STATUS_VALUES.includes(input.status)) {
    errors.status = "Invalid status.";
  }
  if (!TASK_PRIORITY_VALUES.includes(input.priority)) {
    errors.priority = "Invalid priority.";
  }
  return errors;
}

function blank(v: string | null): string | null {
  const t = v?.trim();
  return t ? t : null;
}

export type ListTasksOptions = {
  search?: string | null;
  statusFilter?: TaskStatusFilter;
  /** Restrict to one client's tasks (used for role='client' portal users). */
  clientId?: number | null;
};

export type TaskListItem = Task & {
  clientName: string | null;
  clientCompany: string | null;
};

export async function listTasks({
  search,
  statusFilter = "all",
  clientId,
}: ListTasksOptions = {}): Promise<TaskListItem[]> {
  const conditions: SQL[] = [];

  if (statusFilter === "open") {
    conditions.push(ne(tasks.status, "completed"));
  } else if (statusFilter === "completed") {
    conditions.push(eq(tasks.status, "completed"));
  }

  if (clientId != null) {
    conditions.push(eq(tasks.clientId, clientId));
  }

  const term = search?.trim();
  if (term) {
    conditions.push(ilike(tasks.title, `%${term}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      task: tasks,
      clientName: clients.name,
      clientCompany: clients.companyName,
    })
    .from(tasks)
    .leftJoin(clients, eq(tasks.clientId, clients.id))
    .where(where)
    .orderBy(asc(tasks.dueDate), desc(tasks.createdAt));

  return rows.map((r) => ({
    ...r.task,
    clientName: r.clientName,
    clientCompany: r.clientCompany,
  }));
}

export async function countOpenTasks(
  { clientId }: { clientId?: number | null } = {},
): Promise<number> {
  const conditions: SQL[] = [ne(tasks.status, "completed")];
  if (clientId != null) {
    conditions.push(eq(tasks.clientId, clientId));
  }
  const [row] = await db
    .select({ value: count() })
    .from(tasks)
    .where(and(...conditions));
  return Number(row?.value ?? 0);
}

export async function getTaskById(id: number): Promise<Task> {
  const [row] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, id))
    .limit(1);
  if (!row) throw new TaskNotFoundError(id);
  return row;
}

/**
 * Client-submitted task. The clientId is supplied by the action layer
 * from the session — never by the form — so a portal user can't submit
 * tasks on behalf of someone else.
 */
export async function createClientTask(
  input: ClientTaskInput,
  clientId: number,
): Promise<Task> {
  const [row] = await db
    .insert(tasks)
    .values({
      title: input.title.trim(),
      description: blank(input.description),
      dueDate: blank(input.dueDate),
      status: "todo",
      priority: "medium",
      clientId,
    })
    .returning();
  return row;
}

/**
 * Workflow update by admin/manager. Only `status` and `priority` are
 * touched — title/description/dueDate and the foreign keys stay exactly
 * as the client submitted them.
 */
export async function updateTaskWorkflow(
  id: number,
  input: TaskWorkflowInput,
): Promise<Task> {
  const [row] = await db
    .update(tasks)
    .set({
      status: input.status,
      priority: input.priority,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, id))
    .returning();
  if (!row) throw new TaskNotFoundError(id);
  return row;
}

export async function deleteTask(id: number): Promise<void> {
  const deleted = await db
    .delete(tasks)
    .where(eq(tasks.id, id))
    .returning({ id: tasks.id });
  if (deleted.length === 0) throw new TaskNotFoundError(id);
}
