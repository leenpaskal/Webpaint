"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import DatePicker from "@/components/ui/DatePicker";
import type { InvoiceFormState } from "@/app/actions/invoices";
import {
  CURRENCY_LABELS,
  CURRENCY_VALUES,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_VALUES,
  type InvoiceInput,
} from "@/lib/invoices/invoice-constants";

type Action = (
  prev: InvoiceFormState,
  formData: FormData,
) => Promise<InvoiceFormState>;

export type ClientOption = {
  id: number;
  name: string;
  companyName: string | null;
};

type Props = {
  action: Action;
  clients: ClientOption[];
  initial?: Partial<InvoiceInput>;
  submitLabel: string;
  pendingLabel: string;
  showSavedNotice?: boolean;
};

const initialState: InvoiceFormState = { ok: false };

function clientOptionLabel(c: ClientOption): string {
  if (c.companyName) return `${c.companyName} — ${c.name}`;
  return c.name;
}

export default function InvoiceForm({
  action,
  clients,
  initial,
  submitLabel,
  pendingLabel,
  showSavedNotice,
}: Props) {
  const [state, formAction] = useActionState(action, initialState);
  const values: Partial<InvoiceInput> = state.values ?? initial ?? {};

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

      <Select
        id="clientId"
        name="clientId"
        label="Client"
        required
        defaultValue={
          values.clientId != null && values.clientId !== 0
            ? String(values.clientId)
            : ""
        }
        error={state.fieldErrors?.clientId}
        options={[
          { value: "", label: "— Pick a client —" },
          ...clients.map((c) => ({
            value: String(c.id),
            label: clientOptionLabel(c),
          })),
        ]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Text
          id="invoiceNumber"
          name="invoiceNumber"
          label="Invoice number"
          required
          defaultValue={values.invoiceNumber ?? ""}
          error={state.fieldErrors?.invoiceNumber}
          placeholder="INV-2026-001"
        />
        <Text
          id="total"
          name="total"
          label="Total"
          required
          defaultValue={values.total ?? ""}
          error={state.fieldErrors?.total}
          placeholder="1200.00"
          inputMode="decimal"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Select
          id="status"
          name="status"
          label="Status"
          defaultValue={values.status ?? "draft"}
          error={state.fieldErrors?.status}
          options={INVOICE_STATUS_VALUES.map((s) => ({
            value: s,
            label: INVOICE_STATUS_LABELS[s],
          }))}
        />
        <Select
          id="currency"
          name="currency"
          label="Currency"
          defaultValue={values.currency ?? "EUR"}
          error={state.fieldErrors?.currency}
          options={CURRENCY_VALUES.map((c) => ({
            value: c,
            label: CURRENCY_LABELS[c],
          }))}
        />
        <DateField
          id="dueAt"
          name="dueAt"
          label="Due date"
          defaultValue={values.dueAt ?? ""}
          error={state.fieldErrors?.dueAt}
          placeholder="Pick due date"
        />
      </div>

      <DateField
        id="issuedAt"
        name="issuedAt"
        label="Issued on"
        defaultValue={values.issuedAt ?? ""}
        error={state.fieldErrors?.issuedAt}
        placeholder="Pick issue date"
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

function inputClasses(error?: string): string {
  return `h-11 w-full rounded-md border bg-white px-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/10 ${
    error
      ? "border-red-400 dark:border-red-700"
      : "border-zinc-300 dark:border-zinc-700"
  }`;
}

function FieldShell({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
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

function Text({
  id,
  name,
  label,
  type = "text",
  defaultValue,
  error,
  placeholder,
  required,
  inputMode,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
  inputMode?: "decimal" | "numeric" | "text";
}) {
  return (
    <FieldShell id={id} label={label} required={required} error={error}>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClasses(error)}
      />
    </FieldShell>
  );
}

function DateField({
  id,
  name,
  label,
  defaultValue,
  error,
  placeholder,
  required,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <FieldShell id={id} label={label} required={required} error={error}>
      <DatePicker
        id={id}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        error={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </FieldShell>
  );
}

function Select({
  id,
  name,
  label,
  defaultValue,
  error,
  options,
  required,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  error?: string;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <FieldShell id={id} label={label} required={required} error={error}>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClasses(error)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
