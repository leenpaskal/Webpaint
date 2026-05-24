import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ClientForm from "@/components/clients/ClientForm";
import CreatePortalLoginForm from "@/components/clients/CreatePortalLoginForm";
import DeleteClientButton from "@/components/clients/DeleteClientButton";
import RevokePortalLoginButton from "@/components/clients/RevokePortalLoginButton";
import { updateClientAction } from "@/app/actions/clients";
import { findClientPortalUser } from "@/lib/auth/user-service";
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
  const portalUser = await findClientPortalUser(client.id);

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

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Portal access
        </h2>
        {portalUser ? (
          <>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              This client can log in with the credentials below. To reset
              their password, revoke access and issue new credentials.
            </p>
            <dl className="mt-4 grid grid-cols-1 gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-950">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Name
                </dt>
                <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">
                  {portalUser.name}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Login email
                </dt>
                <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">
                  {portalUser.email}
                </dd>
              </div>
            </dl>
            <div className="mt-5">
              <RevokePortalLoginButton
                clientId={client.id}
                userId={portalUser.id}
                email={portalUser.email}
              />
            </div>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              This client has no portal login yet. Create one and share the
              email and password with them.
            </p>
            <div className="mt-4">
              <CreatePortalLoginForm
                clientId={client.id}
                defaultName={client.name}
                defaultEmail={client.email ?? ""}
              />
            </div>
          </>
        )}
      </section>

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
