"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createPortalLoginAction,
  type PortalLoginFormState,
} from "@/app/actions/clients";

const initialState: PortalLoginFormState = { ok: false };

type Props = {
  clientId: number;
  defaultName: string;
  defaultEmail: string;
};

export default function CreatePortalLoginForm({
  clientId,
  defaultName,
  defaultEmail,
}: Props) {
  const boundAction = createPortalLoginAction.bind(null, clientId);
  const [state, formAction] = useActionState(boundAction, initialState);

  const values = state.values ?? {
    name: defaultName,
    email: defaultEmail,
  };

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          id="portalName"
          name="name"
          label="Contact name"
          defaultValue={values.name}
          error={state.fieldErrors?.name}
          required
        />
        <Field
          id="portalEmail"
          name="email"
          type="email"
          label="Login email"
          defaultValue={values.email}
          error={state.fieldErrors?.email}
          required
          autoComplete="off"
        />
      </div>

      <PasswordField
        id="portalPassword"
        name="password"
        label="Temporary password"
        error={state.fieldErrors?.password}
        helper="Share this with the client securely. They use it to log in (no change-password screen yet — re-run this form to reset)."
      />

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
      {pending ? "Creating login..." : "Create portal login"}
    </button>
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
  required,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  error?: string;
  required?: boolean;
  autoComplete?: string;
}) {
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
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClasses(error)}
      />
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

function PasswordField({
  id,
  name,
  label,
  error,
  helper,
}: {
  id: string;
  name: string;
  label: string;
  error?: string;
  helper?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
      >
        {label}
        <span className="ml-0.5 text-red-600 dark:text-red-400">*</span>
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={revealed ? "text" : "password"}
          autoComplete="new-password"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputClasses(error)} pr-11`}
        />
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          aria-label={revealed ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          {revealed ? "Hide" : "Show"}
        </button>
      </div>
      {error ? (
        <p
          id={`${id}-error`}
          className="text-xs text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      ) : helper ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{helper}</p>
      ) : null}
    </div>
  );
}
