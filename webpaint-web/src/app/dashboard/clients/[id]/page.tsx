import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ClientForm from "@/components/clients/ClientForm";
import DeleteClientButton from "@/components/clients/DeleteClientButton";
import { updateClientAction } from "@/app/actions/clients";
import {
  ClientNotFoundError,
  getClientById,
} from "@/lib/clients/client-service";

export const metadata: Metadata = {
  title: "Client — Webpaint",
};

type Params = Promise<{ id: string }>;

export default async function ClientDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  let client;
  try {
    client = await getClientById(id);
  } catch (err) {
    if (err instanceof ClientNotFoundError) notFound();
    throw err;
  }

  const updateAction = updateClientAction.bind(null, client.id);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard/clients"
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Back to clients
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            {client.name}
          </h1>
          {client.companyName ? (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {client.companyName}
            </p>
          ) : null}
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          Added {new Date(client.createdAt).toLocaleDateString()}
        </p>
      </header>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <ClientForm
          action={updateAction}
          initial={{
            name: client.name,
            companyName: client.companyName,
            email: client.email,
            phone: client.phone,
            address: client.address,
            vatNumber: client.vatNumber,
          }}
          submitLabel="Save changes"
          pendingLabel="Saving..."
          showSavedNotice
        />
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50/50 p-5 dark:border-red-900/40 dark:bg-red-950/20">
        <h2 className="text-sm font-semibold text-red-800 dark:text-red-300">
          Danger zone
        </h2>
        <p className="mt-1 text-sm text-red-700/80 dark:text-red-300/80">
          Deleting this client also removes all their websites, projects,
          tasks and notes.
        </p>
        <div className="mt-4">
          <DeleteClientButton
            clientId={client.id}
            clientName={client.name}
          />
        </div>
      </div>
    </div>
  );
}
