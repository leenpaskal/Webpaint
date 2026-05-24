"use client";

import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  uploadInvoicePdfAction,
  type UploadPdfState,
} from "@/app/actions/invoices";

const initialState: UploadPdfState = { ok: false, error: null };

export default function UploadInvoicePdfForm({
  invoiceId,
  hasExisting,
}: {
  invoiceId: number;
  hasExisting: boolean;
}) {
  const boundAction = uploadInvoicePdfAction.bind(null, invoiceId);
  const [state, formAction] = useActionState(boundAction, initialState);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <form
      action={(formData) => {
        formAction(formData);
        // Reset the file input so the same file can be uploaded again
        // (otherwise some browsers ignore an identical re-select).
        if (fileRef.current) fileRef.current.value = "";
      }}
      className="flex flex-col gap-3"
    >
      {state.ok ? (
        <p
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          PDF uploaded.
        </p>
      ) : null}

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={fileRef}
          type="file"
          name="pdf"
          accept="application/pdf,.pdf"
          required
          className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-800 dark:text-zinc-200 dark:file:bg-white dark:file:text-zinc-900 dark:hover:file:bg-zinc-200"
        />
        <SubmitButton replace={hasExisting} />
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        PDF only, up to 10 MB.
        {hasExisting
          ? " Uploading replaces the current file."
          : ""}
      </p>
    </form>
  );
}

function SubmitButton({ replace }: { replace: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 w-full items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
    >
      {pending ? "Uploading..." : replace ? "Replace PDF" : "Upload PDF"}
    </button>
  );
}
