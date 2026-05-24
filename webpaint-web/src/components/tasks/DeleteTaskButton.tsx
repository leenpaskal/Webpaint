"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteTaskAction,
  type DeleteTaskState,
} from "@/app/actions/tasks";

const initialState: DeleteTaskState = { error: null };

export default function DeleteTaskButton({
  taskId,
  taskTitle,
}: {
  taskId: number;
  taskTitle: string;
}) {
  const boundAction = deleteTaskAction.bind(null, taskId);
  const [state, formAction] = useActionState(boundAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const ok = window.confirm(
          `Delete task "${taskTitle}"? This cannot be undone.`,
        );
        if (!ok) event.preventDefault();
      }}
      className="flex flex-col gap-3"
    >
      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 w-fit items-center justify-center rounded-md border border-red-300 bg-white px-5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-red-950/40"
    >
      {pending ? "Deleting..." : "Delete task"}
    </button>
  );
}
