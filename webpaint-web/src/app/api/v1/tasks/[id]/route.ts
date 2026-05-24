/**
 * /api/v1/tasks/:id
 *
 * GET    fetch one task. Clients can only fetch their own.
 *        200: { task: Task }
 *
 * PATCH  workflow update (admin / manager only). Only `status` and
 *        `priority` can change — matches the service-layer business rule.
 *        Body: { status, priority }
 *        200:  { task: Task }
 *        400:  validation
 *
 * DELETE remove a task (admin / manager). 204 on success.
 */

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { getApiUser, isManagerRole } from "@/lib/api/auth";
import {
  apiBadRequest,
  apiForbidden,
  apiInternal,
  apiNotFound,
  apiUnauthenticated,
  jsonOk,
} from "@/lib/api/responses";
import {
  deleteTask,
  getTaskById,
  TaskNotFoundError,
  updateTaskWorkflow,
  validateTaskWorkflowInput,
} from "@/lib/tasks/task-service";
import {
  TASK_PRIORITY_VALUES,
  TASK_STATUS_VALUES,
  type TaskPriority,
  type TaskStatus,
  type TaskWorkflowInput,
} from "@/lib/tasks/task-constants";

type Params = Promise<{ id: string }>;

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(req: Request, { params }: { params: Params }) {
  const user = await getApiUser(req);
  if (!user) return apiUnauthenticated();

  const { id: raw } = await params;
  const id = parseId(raw);
  if (id === null) return apiNotFound("Task");

  try {
    const task = await getTaskById(id);
    if (!isManagerRole(user.role) && task.clientId !== user.clientId) {
      return apiForbidden();
    }

    // Join the submitting client's display info so admin/manager screens
    // can render "Submitted by ...". Clients already know it's theirs, so
    // we skip the lookup for that role.
    let taskClient: { id: number; name: string; companyName: string | null } | null =
      null;
    if (isManagerRole(user.role) && task.clientId != null) {
      const [row] = await db
        .select({
          id: clients.id,
          name: clients.name,
          companyName: clients.companyName,
        })
        .from(clients)
        .where(eq(clients.id, task.clientId))
        .limit(1);
      taskClient = row ?? null;
    }

    return jsonOk({ task, client: taskClient });
  } catch (err) {
    if (err instanceof TaskNotFoundError) return apiNotFound("Task");
    console.error("api get task failed", err);
    return apiInternal();
  }
}

export async function PATCH(req: Request, { params }: { params: Params }) {
  const user = await getApiUser(req);
  if (!user) return apiUnauthenticated();
  if (!isManagerRole(user.role)) return apiForbidden();

  const { id: raw } = await params;
  const id = parseId(raw);
  if (id === null) return apiNotFound("Task");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiBadRequest("Invalid JSON body.");
  }

  const obj = (body ?? {}) as Record<string, unknown>;
  const status =
    typeof obj.status === "string" && TASK_STATUS_VALUES.includes(obj.status as TaskStatus)
      ? (obj.status as TaskStatus)
      : ("todo" as TaskStatus);
  const priority =
    typeof obj.priority === "string" && TASK_PRIORITY_VALUES.includes(obj.priority as TaskPriority)
      ? (obj.priority as TaskPriority)
      : ("medium" as TaskPriority);

  const input: TaskWorkflowInput = { status, priority };

  const fieldErrors = validateTaskWorkflowInput(input);
  if (Object.keys(fieldErrors).length > 0) {
    return apiBadRequest("Validation failed.", fieldErrors);
  }

  try {
    const task = await updateTaskWorkflow(id, input);
    return jsonOk({ task });
  } catch (err) {
    if (err instanceof TaskNotFoundError) return apiNotFound("Task");
    console.error("api update task failed", err);
    return apiInternal();
  }
}

export async function DELETE(req: Request, { params }: { params: Params }) {
  const user = await getApiUser(req);
  if (!user) return apiUnauthenticated();
  if (!isManagerRole(user.role)) return apiForbidden();

  const { id: raw } = await params;
  const id = parseId(raw);
  if (id === null) return apiNotFound("Task");

  try {
    await deleteTask(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof TaskNotFoundError) return apiNotFound("Task");
    console.error("api delete task failed", err);
    return apiInternal();
  }
}
