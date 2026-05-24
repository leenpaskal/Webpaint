"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ClientTaskFormState } from "@/app/actions/tasks";
import { createClientTaskAction } from "@/app/actions/tasks";
import type { ClientTaskInput } from "@/lib/tasks/task-constants";

const initialState: ClientTaskFormState = { ok: false };

export default function ClientTaskForm() {
  const [state, formAction] = useActionState(
    createClientTaskAction,
    initialState,
  );
  const values: Partial<ClientTaskInput> = state.values ?? {};

  return (
    <form noValidate action={formAction} className="flex flex-col gap-4">
      {state.formError ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.formError}
        </p>
      ) : null}

      <Field
        id="title"
        name="title"
        label="Title"
        required
        defaultValue={values.title ?? ""}
        error={state.fieldErrors?.title}
        placeholder="What do you need done?"
      />

      <TextArea
        id="description"
        name="description"
        label="Description"
        defaultValue={values.description ?? ""}
        error={state.fieldErrors?.description}
        placeholder="Add context, links, screenshots or anything that helps…"
      />

      <Field
        id="dueDate"
        name="dueDate"
        label="Due date"
        type="date"
        defaultValue={values.dueDate ?? ""}
        error={state.fieldErrors?.dueDate}
      />

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Status and priority will be set by the Webpaint team once they pick
        up the task.
      </p>

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
      {pending ? "Submitting..." : "Submit task"}
    </button>
  );
}

type FieldShellProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
};

function FieldShell({
  id,
  label,
  required,
  error,
  children,
}: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
      >
        {label}
        {required ? (
          <span className="ml-0.5 text-red-600 dark:text-red-400">*</span>
        ) : null}
      </label>
      {children}
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

function inputClasses(error?: string): string {
  return `h-11 w-full rounded-md border bg-white px-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/10 ${
    error
      ? "border-red-400 dark:border-red-700"
      : "border-zinc-300 dark:border-zinc-700"
  }`;
}

function Field({
  id,
  name,
  label,
  type = "text",
  defaultValue,
  error,
  placeholder,
  required,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <FieldShell id={id} label={label} required={required} error={error}>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClasses(error)}
      />
    </FieldShell>
  );
}

function TextArea({
  id,
  name,
  label,
  defaultValue,
  error,
  placeholder,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  error?: string;
  placeholder?: string;
}) {
  return (
    <FieldShell id={id} label={label} error={error}>
      <textarea
        id={id}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={5}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/10 ${
          error
            ? "border-red-400 dark:border-red-700"
            : "border-zinc-300 dark:border-zinc-700"
        }`}
      />
    </FieldShell>
  );
}
