import type { Metadata } from "next";
import Link from "next/link";
import InvoicesTable from "@/components/invoices/InvoicesTable";
import { requireUser } from "@/lib/auth/session";
import { listInvoices } from "@/lib/invoices/invoice-service";
import {
  INVOICE_STATUS_FILTERS,
  type InvoiceStatusFilter,
} from "@/lib/invoices/invoice-constants";

export const metadata: Metadata = {
  title: "Invoices — Webpaint",
};

type SearchParams = Promise<{
  q?: string | string[];
  status?: string | string[];
}>;

const STATUS_LABELS: Record<InvoiceStatusFilter, string> = {
  all: "All",
  unpaid: "Unpaid",
  paid: "Paid",
};

function readString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function parseStatusFilter(raw: string): InvoiceStatusFilter {
  return (INVOICE_STATUS_FILTERS as readonly string[]).includes(raw)
    ? (raw as InvoiceStatusFilter)
    : "all";
}

function buildHref(
  base: string,
  params: Record<string, string | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const query = readString(params.q);
  const statusFilter = parseStatusFilter(readString(params.status));

  const isClient = user.role === "client";
  const scopedClientId = isClient ? user.clientId : null;

  const invoices =
    isClient && scopedClientId == null
      ? []
      : await listInvoices({
          search: query || null,
          statusFilter,
          clientId: scopedClientId ?? undefined,
        });

  const canManage = user.role === "admin" || user.role === "manager";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            Invoices
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {canManage
              ? "Create invoices, upload the PDF, and track payment status."
              : "View your invoices and download the original PDF."}
          </p>
        </div>
        {canManage ? (
          <Link
            href="/dashboard/invoices/new"
            className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            New invoice
          </Link>
        ) : null}
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav
          aria-label="Filter by status"
          className="flex flex-wrap gap-1 rounded-md border border-zinc-200 bg-white p-1 text-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          {INVOICE_STATUS_FILTERS.map((filter) => {
            const active = filter === statusFilter;
            return (
              <Link
                key={filter}
                href={buildHref("/dashboard/invoices", {
                  status: filter === "all" ? undefined : filter,
                  q: query || undefined,
                })}
                className={`rounded px-3 py-1.5 font-medium transition-colors ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {STATUS_LABELS[filter]}
              </Link>
            );
          })}
        </nav>

        <form
          method="get"
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          {statusFilter !== "all" ? (
            <input type="hidden" name="status" value={statusFilter} />
          ) : null}
          <label htmlFor="q" className="sr-only">
            Search invoices
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder={
              canManage
                ? "Search by number, client, or company"
                : "Search by number"
            }
            className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 sm:max-w-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/10"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Search
            </button>
            {query ? (
              <Link
                href={buildHref("/dashboard/invoices", {
                  status: statusFilter === "all" ? undefined : statusFilter,
                })}
                className="inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Clear
              </Link>
            ) : null}
          </div>
        </form>
      </div>

      {query ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {invoices.length} result{invoices.length === 1 ? "" : "s"} for &ldquo;
          {query}&rdquo;
        </p>
      ) : null}

      <InvoicesTable
        invoices={invoices}
        hideClient={isClient}
        canCreate={canManage}
      />
    </div>
  );
}
