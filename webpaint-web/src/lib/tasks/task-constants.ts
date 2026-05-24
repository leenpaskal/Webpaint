/**
 * Tasks — shared types and enum constants safe for BOTH client and server.
 *
 * No "server-only" marker, no database imports. Anything in the tasks tab
 * that needs a label or an allowed-value list pulls from here so that
 * client components don't accidentally drag the service module (which has
 * `import "server-only"`) into the client bundle.
 *
 * Business rules baked into the shape of the inputs:
 * - A portal user with role='client' SUBMITS tasks. They control the
 *   title, description and due date only — status starts at 'todo' and
 *   priority at 'medium'. That's `ClientTaskInput`.
 * - An admin/manager MANAGES tasks. They only update workflow fields:
 *   status and priority. That's `TaskWorkflowInput`.
 */

import type { Task } from "@/db/schema";

export type TaskStatus = Task["status"];
export type TaskPriority = Task["priority"];

/** Fields a client fills in when submitting a new task. */
export type ClientTaskInput = {
  title: string;
  description: string | null;
  dueDate: string | null;
};

export type ClientTaskFieldErrors = Partial<
  Record<keyof ClientTaskInput, string>
>;

/** Fields an admin / manager can change after submission. */
export type TaskWorkflowInput = {
  status: TaskStatus;
  priority: TaskPriority;
};

export type TaskWorkflowFieldErrors = Partial<
  Record<keyof TaskWorkflowInput, string>
>;

export type TaskStatusFilter = "all" | "open" | "completed";

export const TASK_STATUS_VALUES: readonly TaskStatus[] = [
  "todo",
  "in_progress",
  "review",
  "completed",
];

export const TASK_PRIORITY_VALUES: readonly TaskPriority[] = [
  "low",
  "medium",
  "high",
  "urgent",
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  review: "Review",
  completed: "Completed",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const TASK_STATUS_FILTERS: readonly TaskStatusFilter[] = [
  "all",
  "open",
  "completed",
];
