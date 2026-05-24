"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { TaskWorkflowFormState } from "@/app/actions/tasks";
import { updateTaskWorkflowAction } from "@/app/actions/tasks";
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_VALUES,
  TASK_STATUS_LABELS,
  TASK_STATUS_VALUES,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/tasks/task-constants";

const initialState: TaskWorkflowFormState = { ok: false };

type Props = {
  taskId: number;
  initial: {
    status: TaskStatus;
    priority: TaskPriority;
  };
};

export default function TaskWorkflowForm({ taskId, initial }: Props) {
  const boundAction = updateTaskWorkflowAction.bind(null, taskId);
  const [state, formAction] = useActionState(boundAction, initialState);
  const values = state.values ?? initial;

  return (
    <form noValidate action={formAction} className="flex flex-col gap-4">
      {state.ok ? (
        <p
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          Changes saved.
        </p>
      ) : null}

      {state.formError ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.formError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          id="status"
          name="status"
          label="Status"
          defaultValue={values.status}
          error={state.fieldErrors?.status}
          options={TASK_STATUS_VALUES.map((s) => ({
            value: s,
            label: TASK_STATUS_LABELS[s],
          }))}
        />
        <Select
          id="priority"
          name="priority"
          label="Priority"
          defaultValue={values.priority}
          error={state.fieldErrors?.priority}
          options={TASK_PRIORITY_VALUES.map((p) => ({
            value: p,
            label: TASK_PRIORITY_LABELS[p],
          }))}
        />
      </div>

      <div className="mt-2 flex">
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? "Saving..." : "Save changes"}
    </button>
  );
}

function Select({
  id,
  name,
  label,
  defaultValue,
  error,
  options,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  error?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
      >
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`h-11 w-full rounded-md border bg-white px-3 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/10 ${
          error
            ? "border-red-400 dark:border-red-700"
            : "border-zinc-300 dark:border-zinc-700"
        }`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p
          id={`${id}-error`}
          className="text-xs text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
