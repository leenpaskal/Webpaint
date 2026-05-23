import type { Metadata } from "next";
import Link from "next/link";
import ClientsTable from "@/components/clients/ClientsTable";
import { listClients } from "@/lib/clients/client-service";

export const metadata: Metadata = {
  title: "Clients — Webpaint",
};

type SearchParams = Promise<{ q?: string | string[] }>;

function readSearch(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = readSearch(params.q);
  const clients = await listClients({ search: query || null });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            Clients
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Manage every client your agency works with.
          </p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          New client
        </Link>
      </header>

      <form
        method="get"
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <label htmlFor="q" className="sr-only">
          Search clients
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="Search by name, company or email"
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
              href="/dashboard/clients"
              className="inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      {query ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {clients.length} result{clients.length === 1 ? "" : "s"} for &ldquo;
          {query}&rdquo;
        </p>
      ) : null}

      <ClientsTable clients={clients} />
    </div>
  );
}
