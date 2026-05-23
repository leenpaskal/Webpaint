"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ClientFormState } from "@/app/actions/clients";
import type { ClientInput } from "@/lib/clients/client-service";

type Action = (
  prev: ClientFormState,
  formData: FormData,
) => Promise<ClientFormState>;

type Props = {
  action: Action;
  initial?: Partial<ClientInput>;
  submitLabel: string;
  pendingLabel: string;
  showSavedNotice?: boolean;
};

const initialState: ClientFormState = { ok: false };

export default function ClientForm({
  action,
  initial,
  submitLabel,
  pendingLabel,
  showSavedNotice,
}: Props) {
  const [state, formAction] = useActionState(action, initialState);
  const values = state.values ?? initial ?? {};

  return (
    <form noValidate action={formAction} className="flex flex-col gap-4">
      {showSavedNotice && state.ok ? (
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
        <Field
          id="name"
          name="name"
          label="Contact name"
          required
          defaultValue={values.name ?? ""}
          error={state.fieldErrors?.name}
          placeholder="Jane Doe"
        />
        <Field
          id="companyName"
          name="companyName"
          label="Company"
          defaultValue={values.companyName ?? ""}
          error={state.fieldErrors?.companyName}
          placeholder="Acme Ltd."
        />
        <Field
          id="email"
          name="email"
          type="email"
          label="Email"
          defaultValue={values.email ?? ""}
          error={state.fieldErrors?.email}
          placeholder="contact@acme.com"
          autoComplete="email"
        />
        <Field
          id="phone"
          name="phone"
          label="Phone"
          defaultValue={values.phone ?? ""}
          error={state.fieldErrors?.phone}
          placeholder="+359 ..."
          autoComplete="tel"
        />
        <Field
          id="vatNumber"
          name="vatNumber"
          label="VAT number"
          defaultValue={values.vatNumber ?? ""}
          error={state.fieldErrors?.vatNumber}
          placeholder="BG123456789"
        />
      </div>

      <TextArea
        id="address"
        name="address"
        label="Address"
        defaultValue={values.address ?? ""}
        error={state.fieldErrors?.address}
        placeholder="Street, city, country"
      />

      <div className="mt-2 flex">
        <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
      </div>
    </form>
  );
}

function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  defaultValue,
  error,
  placeholder,
  autoComplete,
  required,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
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
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`h-11 w-full rounded-md border bg-white px-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/10 ${
          error
            ? "border-red-400 dark:border-red-700"
            : "border-zinc-300 dark:border-zinc-700"
        }`}
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
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
      >
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={3}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/10 ${
          error
            ? "border-red-400 dark:border-red-700"
            : "border-zinc-300 dark:border-zinc-700"
        }`}
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
