import type { Task } from "@/db/schema";
import { PriorityBadge, StatusBadge } from "./badges";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default function TaskDetails({
  task,
  clientLabel,
}: {
  task: Task;
  clientLabel?: string | null;
}) {
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Row label="Status">
        <StatusBadge status={task.status} />
      </Row>
      <Row label="Priority">
        <PriorityBadge priority={task.priority} />
      </Row>
      <Row label="Due date">{formatDate(task.dueDate)}</Row>
      <Row label="Submitted by">{clientLabel ?? "—"}</Row>
      <div className="sm:col-span-2">
        <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Description
        </dt>
        <dd className="mt-1 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
          {task.description?.trim() || "No description provided."}
        </dd>
      </div>
    </dl>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
        {children}
      </dd>
    </div>
  );
}
