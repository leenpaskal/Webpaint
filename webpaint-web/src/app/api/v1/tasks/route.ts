/**
 * /api/v1/tasks
 *
 * GET  list tasks.
 *      - admin / manager: all tasks
 *      - role='client': only their own tasks
 *      Query: ?q=<search>&status=all|open|completed&clientId=<id>
 *      200:  { tasks: TaskListItem[] }
 *
 * POST submit a new task. Mirrors the portal-client flow:
 *      Body:  { title, description?, dueDate?, clientId? }
 *             role='client' callers ignore clientId (it's taken from
 *             their session). admin/manager must supply clientId.
 *      201:   { task: Task }
 *      400:   { error: { code: "validation", fieldErrors: {...} } }
 */

import { getApiUser, isManagerRole } from "@/lib/api/auth";
import {
  apiBadRequest,
  apiForbidden,
  apiInternal,
  apiUnauthenticated,
  jsonOk,
} from "@/lib/api/responses";
import {
  createClientTask,
  listTasks,
  validateClientTaskInput,
} from "@/lib/tasks/task-service";
import type {
  ClientTaskInput,
  TaskStatusFilter,
} from "@/lib/tasks/task-constants";

function parseStatusFilter(raw: string | null): TaskStatusFilter {
  if (raw === "open" || raw === "completed" || raw === "all") return raw;
  return "all";
}

function parseClientId(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function readNullableString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

export async function GET(req: Request) {
  const user = await getApiUser(req);
  if (!user) return apiUnauthenticated();

  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const statusFilter = parseStatusFilter(url.searchParams.get("status"));
  const clientIdParam = parseClientId(url.searchParams.get("clientId"));

  const scopedClientId = isManagerRole(user.role)
    ? clientIdParam
    : user.clientId ?? -1;

  try {
    const tasks = await listTasks({
      search: q,
      statusFilter,
      clientId: scopedClientId,
    });
    return jsonOk({ tasks });
  } catch (err) {
    console.error("api list tasks failed", err);
    return apiInternal();
  }
}

export async function POST(req: Request) {
  const user = await getApiUser(req);
  if (!user) return apiUnauthenticated();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiBadRequest("Invalid JSON body.");
  }

  const obj = (body ?? {}) as Record<string, unknown>;
  const input: ClientTaskInput = {
    title: typeof obj.title === "string" ? obj.title : "",
    description: readNullableString(obj.description),
    dueDate: readNullableString(obj.dueDate),
  };

  // Resolve the clientId the task is filed under. Clients always get
  // their own; managers/admins must supply one.
  let clientId: number | null = null;
  if (isManagerRole(user.role)) {
    const raw = Number(obj.clientId);
    if (!Number.isInteger(raw) || raw <= 0) {
      return apiBadRequest("Validation failed.", {
        clientId: "Pick a client.",
      });
    }
    clientId = raw;
  } else {
    if (user.clientId == null) return apiForbidden();
    clientId = user.clientId;
  }

  const fieldErrors = validateClientTaskInput(input);
  if (Object.keys(fieldErrors).length > 0) {
    return apiBadRequest("Validation failed.", fieldErrors);
  }

  try {
    const task = await createClientTask(input, clientId);
    return jsonOk({ task }, 201);
  } catch (err) {
    console.error("api create task failed", err);
    return apiInternal();
  }
}
