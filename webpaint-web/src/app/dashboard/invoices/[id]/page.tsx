import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import DeleteInvoiceButton from "@/components/invoices/DeleteInvoiceButton";
import InvoiceForm from "@/components/invoices/InvoiceForm";
import InvoiceStatusBadge from "@/components/invoices/InvoiceStatusBadge";
import RemoveInvoicePdfButton from "@/components/invoices/RemoveInvoicePdfButton";
import UploadInvoicePdfForm from "@/components/invoices/UploadInvoicePdfForm";
import { updateInvoiceAction } from "@/app/actions/invoices";
import { db } from "@/db";
import { clients } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { listClients } from "@/lib/clients/client-service";
import {
  getInvoiceById,
  InvoiceNotFoundError,
} from "@/lib/invoices/invoice-service";

export const metadata: Metadata = {
  title: "Invoice — Webpaint",
};

type Params = Promise<{ id: string }>;

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatMoney(amount: string, currency: string): string {
  const n = Number(amount);
  if (Number.isNaN(n)) return `${amount} ${currency}`;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Params;
}) {
  const user = await requireUser();
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  let invoice;
  try {
    invoice = await getInvoiceById(id);
  } catch (err) {
    if (err instanceof InvoiceNotFoundError) notFound();
    throw err;
  }

  const isClient = user.role === "client";
  if (isClient && invoice.clientId !== user.clientId) notFound();

  const canManage = user.role === "admin" || user.role === "manager";

  // Look up the client for display.
  const [clientRow] = await db
    .select({
      id: clients.id,
      name: clients.name,
      companyName: clients.companyName,
    })
    .from(clients)
    .where(eq(clients.id, invoice.clientId))
    .limit(1);

  const clientLabel = clientRow
    ? clientRow.companyName
      ? `${clientRow.companyName} — ${clientRow.name}`
      : clientRow.name
    : "—";

  const allClients = canManage ? await listClients() : [];
  const updateAction = canManage
    ? updateInvoiceAction.bind(null, invoice.id)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard/invoices"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Back to invoices
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            {invoice.invoiceNumber}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {clientLabel}
          </p>
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <InvoiceStatusBadge status={invoice.status} />
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {formatMoney(invoice.total, invoice.currency)}
          </p>
        </div>
      </header>

      {/* Summary — visible to all */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Row label="Issued on">{formatDate(invoice.issuedAt)}</Row>
          <Row label="Due">{formatDate(invoice.dueAt)}</Row>
          <Row label="Currency">{invoice.currency}</Row>
        </dl>
      </section>

      {/* PDF — visible to all, but only admin/manager can upload/remove */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Invoice PDF
        </h2>

        {invoice.pdfPath ? (
          <div className="mt-3 flex flex-col gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {invoice.pdfOriginalName ?? `${invoice.invoiceNumber}.pdf`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`/api/invoices/${invoice.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Open PDF
              </a>
              {canManage ? (
                <RemoveInvoicePdfButton
                  invoiceId={invoice.id}
                  fileName={
                    invoice.pdfOriginalName ?? `${invoice.invoiceNumber}.pdf`
                  }
                />
              ) : null}
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {canManage
              ? "No PDF attached yet. Upload the invoice document below."
              : "The PDF for this invoice hasn't been uploaded yet."}
          </p>
        )}

        {canManage ? (
          <div className="mt-5">
            <UploadInvoicePdfForm
              invoiceId={invoice.id}
              hasExisting={Boolean(invoice.pdfPath)}
            />
          </div>
        ) : null}
      </section>

      {canManage && updateAction ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Invoice details
          </h2>
          <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
            Update metadata. The PDF itself is managed in the section above.
          </p>
          <InvoiceForm
            action={updateAction}
            clients={allClients}
            initial={{
              clientId: invoice.clientId,
              invoiceNumber: invoice.invoiceNumber,
              status: invoice.status,
              currency: invoice.currency,
              total: invoice.total,
              issuedAt: invoice.issuedAt,
              dueAt: invoice.dueAt,
            }}
            submitLabel="Save changes"
            pendingLabel="Saving..."
            showSavedNotice
          />
        </section>
      ) : null}

      {canManage ? (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-5 dark:border-red-900/40 dark:bg-red-950/20">
          <h2 className="text-sm font-semibold text-red-800 dark:text-red-300">
            Danger zone
          </h2>
          <p className="mt-1 text-sm text-red-700/80 dark:text-red-300/80">
            Deleting this invoice also removes the attached PDF and any
            recorded payments.
          </p>
          <div className="mt-4">
            <DeleteInvoiceButton
              invoiceId={invoice.id}
              invoiceNumber={invoice.invoiceNumber}
            />
          </div>
        </div>
      ) : null}

    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
        {children}
      </dd>
    </div>
  );
}
