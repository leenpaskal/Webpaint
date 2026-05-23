import Link from "next/link";
import type { Client } from "@/db/schema";

export default function ClientsTable({ clients }: { clients: Client[] }) {
  if (clients.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          No clients yet
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Add your first client to get started.
        </p>
        <Link
          href="/dashboard/clients/new"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          New client
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Mobile: card list */}
      <ul className="flex flex-col gap-3 md:hidden">
        {clients.map((client) => (
          <li key={client.id}>
            <Link
              href={`/dashboard/clients/${client.id}`}
              className="block rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {client.name}
              </p>
              {client.companyName ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {client.companyName}
                </p>
              ) : null}
              <div className="mt-3 flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                {client.email ? <span>{client.email}</span> : null}
                {client.phone ? <span>{client.phone}</span> : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-lg border border-zinc-200 bg-white md:block dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          <thead className="bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
            <tr>
              <th scope="col" className="px-4 py-3">
                Name
              </th>
              <th scope="col" className="px-4 py-3">
                Company
              </th>
              <th scope="col" className="px-4 py-3">
                Email
              </th>
              <th scope="col" className="px-4 py-3">
                Phone
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {clients.map((client) => (
              <tr
                key={client.id}
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
              >
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="hover:underline"
                  >
                    {client.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  {client.companyName ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  {client.email ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  {client.phone ?? "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="text-xs font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
                  >
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
