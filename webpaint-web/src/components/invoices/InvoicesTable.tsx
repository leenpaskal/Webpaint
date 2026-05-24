import Link from "next/link";
import InvoiceStatusBadge from "./InvoiceStatusBadge";
import type { InvoiceListItem } from "@/lib/invoices/invoice-service";

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

function clientLabel(item: InvoiceListItem): string | null {
  if (item.clientCompany && item.clientName) {
    return `${item.clientCompany} — ${item.clientName}`;
  }
  return item.clientCompany ?? item.clientName ?? null;
}

export default function InvoicesTable({
  invoices,
  hideClient = false,
  canCreate = true,
}: {
  invoices: InvoiceListItem[];
  hideClient?: boolean;
  canCreate?: boolean;
}) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          No invoices yet
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {canCreate
            ? "Create an invoice and upload the PDF."
            : "Invoices will appear here once issued."}
        </p>
        {canCreate ? (
          <Link
            href="/dashboard/invoices/new"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            New invoice
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <ul className="flex flex-col gap-3 md:hidden">
        {invoices.map((invoice) => {
          const label = hideClient ? null : clientLabel(invoice);
          return (
            <li key={invoice.id}>
              <Link
                href={`/dashboard/invoices/${invoice.id}`}
                className="block rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {invoice.invoiceNumber}
                    </p>
                    {label ? (
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {label}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatMoney(invoice.total, invoice.currency)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <InvoiceStatusBadge status={invoice.status} />
                  {invoice.pdfPath ? (
                    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      PDF
                    </span>
                  ) : null}
                  <span className="ml-auto text-xs text-zinc-500 dark:text-zinc-400">
                    Due {formatDate(invoice.dueAt)}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-lg border border-zinc-200 bg-white md:block dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th scope="col" className="px-4 py-3">
                Number
              </th>
              {hideClient ? null : (
                <th scope="col" className="px-4 py-3">
                  Client
                </th>
              )}
              <th scope="col" className="px-4 py-3">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Total
              </th>
              <th scope="col" className="px-4 py-3">
                Issued
              </th>
              <th scope="col" className="px-4 py-3">
                Due
              </th>
              <th scope="col" className="px-4 py-3">
                PDF
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {invoices.map((invoice) => {
              const label = hideClient ? null : clientLabel(invoice);
              return (
                <tr
                  key={invoice.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    <Link
                      href={`/dashboard/invoices/${invoice.id}`}
                      className="hover:underline"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  {hideClient ? null : (
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                      {label ?? "—"}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <InvoiceStatusBadge status={invoice.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-50">
                    {formatMoney(invoice.total, invoice.currency)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {formatDate(invoice.issuedAt)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {formatDate(invoice.dueAt)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {invoice.pdfPath ? (
                      <a
                        href={`/api/invoices/${invoice.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-zinc-700 hover:underline dark:text-zinc-200"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/invoices/${invoice.id}`}
                      className="text-xs font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
