import Link from "next/link";
import { PriorityBadge, StatusBadge } from "./badges";
import type { TaskListItem } from "@/lib/tasks/task-service";

function formatDueDate(value: string | null): string {
  if (!value) return "—";
  // Parse as local midnight so the rendered date isn't shifted by timezone.
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function clientLabel(task: TaskListItem): string | null {
  if (task.clientCompany && task.clientName) {
    return `${task.clientCompany} — ${task.clientName}`;
  }
  return task.clientCompany ?? task.clientName ?? null;
}

export default function TasksTable({
  tasks,
  hideClient = false,
  canCreate = true,
}: {
  tasks: TaskListItem[];
  hideClient?: boolean;
  canCreate?: boolean;
}) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          No tasks here
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {canCreate
            ? "Submit a task to start tracking work."
            : "Tasks submitted by clients will appear here."}
        </p>
        {canCreate ? (
          <Link
            href="/dashboard/tasks/new"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            New task
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <ul className="flex flex-col gap-3 md:hidden">
        {tasks.map((task) => {
          const label = hideClient ? null : clientLabel(task);
          return (
            <li key={task.id}>
              <Link
                href={`/dashboard/tasks/${task.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {task.title}
                </p>
                {label ? (
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {label}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">
                    Due {formatDueDate(task.dueDate)}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-lg border border-zinc-200 bg-white md:block dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th scope="col" className="px-4 py-3">
                Task
              </th>
              {hideClient ? null : (
                <th scope="col" className="px-4 py-3">
                  Client
                </th>
              )}
              <th scope="col" className="px-4 py-3">
                Status
              </th>
              <th scope="col" className="px-4 py-3">
                Priority
              </th>
              <th scope="col" className="px-4 py-3">
                Due
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {tasks.map((task) => {
              const label = hideClient ? null : clientLabel(task);
              return (
                <tr
                  key={task.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    <Link
                      href={`/dashboard/tasks/${task.id}`}
                      className="hover:underline"
                    >
                      {task.title}
                    </Link>
                  </td>
                  {hideClient ? null : (
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {label ?? "—"}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {formatDueDate(task.dueDate)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/tasks/${task.id}`}
                      className="text-xs font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
