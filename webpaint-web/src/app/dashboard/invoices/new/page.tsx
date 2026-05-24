import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import { createInvoiceAction } from "@/app/actions/invoices";
import { requireUser } from "@/lib/auth/session";
import { listClients } from "@/lib/clients/client-service";

export const metadata: Metadata = {
  title: "New invoice — Webpaint",
};

export default async function NewInvoicePage() {
  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "manager") {
    redirect("/dashboard/invoices");
  }

  const clients = await listClients();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/dashboard/invoices"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back to invoices
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
          New invoice
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Save the invoice details first, then upload the PDF on the next
          screen.
        </p>
      </header>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <InvoiceForm
          action={createInvoiceAction}
          clients={clients}
          submitLabel="Create invoice"
          pendingLabel="Creating..."
        />
      </div>
    </div>
  );
}
