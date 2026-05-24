import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import DeleteTaskButton from "@/components/tasks/DeleteTaskButton";
import TaskDetails from "@/components/tasks/TaskDetails";
import TaskWorkflowForm from "@/components/tasks/TaskWorkflowForm";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import {
  getTaskById,
  TaskNotFoundError,
} from "@/lib/tasks/task-service";

export const metadata: Metadata = {
  title: "Task — Webpaint",
};

type Params = Promise<{ id: string }>;

function buildClientLabel(
  name: string | null,
  companyName: string | null,
): string | null {
  if (companyName && name) return `${companyName} — ${name}`;
  return companyName ?? name ?? null;
}

export default async function TaskDetailPage({
  params,
}: {
  params: Params;
}) {
  const user = await requireUser();
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  let task;
  try {
    task = await getTaskById(id);
  } catch (err) {
    if (err instanceof TaskNotFoundError) notFound();
    throw err;
  }

  // Clients can only see their own tasks. Don't leak existence of
  // other clients' rows — 404 instead of 403.
  const isClient = user.role === "client";
  if (isClient && task.clientId !== user.clientId) notFound();

  const canManage = user.role === "admin" || user.role === "manager";

  // Look up the submitting client's display label (for managers only —
  // clients already know it's theirs).
  let clientLabel: string | null = null;
  if (!isClient && task.clientId != null) {
    const [row] = await db
      .select({
        name: clients.name,
        companyName: clients.companyName,
      })
      .from(clients)
      .where(eq(clients.id, task.clientId))
      .limit(1);
    if (row) clientLabel = buildClientLabel(row.name, row.companyName);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard/tasks"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Back to tasks
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            {task.title}
          </h1>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          Submitted {new Date(task.createdAt).toLocaleDateString()}
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Details
        </h2>
        <TaskDetails task={task} clientLabel={clientLabel} />
      </section>

      {canManage ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Workflow
          </h2>
          <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
            Update the status and priority as the work moves forward.
          </p>
          <TaskWorkflowForm
            taskId={task.id}
            initial={{ status: task.status, priority: task.priority }}
          />
        </section>
      ) : (
        <p className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          The Webpaint team manages status and priority. You&apos;ll see
          updates here as they progress.
        </p>
      )}

      {canManage ? (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-5 dark:border-red-900/40 dark:bg-red-950/20">
          <h2 className="text-sm font-semibold text-red-800 dark:text-red-300">
            Danger zone
          </h2>
          <p className="mt-1 text-sm text-red-700/80 dark:text-red-300/80">
            Deleting this task also removes any notes attached to it.
          </p>
          <div className="mt-4">
            <DeleteTaskButton taskId={task.id} taskTitle={task.title} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
