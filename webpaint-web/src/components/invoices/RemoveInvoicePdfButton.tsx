"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  removeInvoicePdfAction,
  type RemovePdfState,
} from "@/app/actions/invoices";

const initialState: RemovePdfState = { error: null };

export default function RemoveInvoicePdfButton({
  invoiceId,
  fileName,
}: {
  invoiceId: number;
  fileName: string;
}) {
  const boundAction = removeInvoicePdfAction.bind(null, invoiceId);
  const [state, formAction] = useActionState(boundAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const ok = window.confirm(
          `Remove the attached PDF "${fileName}"? You can upload a new one afterwards.`,
        );
        if (!ok) event.preventDefault();
      }}
      className="flex flex-col gap-2"
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
      className="inline-flex h-9 w-fit items-center justify-center rounded-md px-3 text-xs font-medium text-zinc-600 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400 dark:hover:text-zinc-100"
    >
      {pending ? "Removing..." : "Remove PDF"}
    </button>
  );
}
