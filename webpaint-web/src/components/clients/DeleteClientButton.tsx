"use client";

import { useTransition } from "react";
import { deleteClientAction } from "@/app/actions/clients";

export default function DeleteClientButton({
  clientId,
  clientName,
}: {
  clientId: number;
  clientName: string;
}) {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    const ok = window.confirm(
      `Delete client "${clientName}"? This will also remove their websites, projects, tasks and notes. This cannot be undone.`,
    );
    if (!ok) return;
    startTransition(() => {
      void deleteClientAction(clientId);
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-md border border-red-300 bg-white px-5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-red-950/40"
    >
      {pending ? "Deleting..." : "Delete client"}
    </button>
  );
}
