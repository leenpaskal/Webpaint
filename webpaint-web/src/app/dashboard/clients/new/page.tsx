import type { Metadata } from "next";
import Link from "next/link";
import ClientForm from "@/components/clients/ClientForm";
import { createClientAction } from "@/app/actions/clients";

export const metadata: Metadata = {
  title: "New client — Webpaint",
};

export default function NewClientPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/dashboard/clients"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back to clients
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
          New client
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Fill in the contact details. You can edit them later.
        </p>
      </header>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <ClientForm
          action={createClientAction}
          submitLabel="Create client"
          pendingLabel="Creating..."
        />
      </div>
    </div>
  );
}
