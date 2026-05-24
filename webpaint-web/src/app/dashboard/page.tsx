import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { countClients } from "@/lib/clients/client-service";
import { countOpenTasks } from "@/lib/tasks/task-service";

export const metadata: Metadata = {
  title: "Dashboard — Webpaint",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const isClient = user.role === "client";

  // The Clients tile leaks total customer count, so don't fetch it for
  // portal client accounts.
  const [clientCount, openTaskCount] = await Promise.all([
    isClient ? Promise.resolve(0) : countClients(),
    countOpenTasks({
      clientId: isClient ? user.clientId : null,
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Signed in as {user.email}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
          Welcome, {user.name.split(" ")[0]}.
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          This is your private workspace.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isClient ? null : (
          <StatCard
            title="Clients"
            value={String(clientCount)}
            hint={
              clientCount === 0 ? "Add your first client" : "Manage clients"
            }
            href="/dashboard/clients"
          />
        )}
        <StatCard
          title="Open tasks"
          value={String(openTaskCount)}
          hint={
            openTaskCount === 0
              ? isClient
                ? "Submit your first task"
                : "No open tasks"
              : isClient
                ? "Track your submissions"
                : "Manage tasks"
          }
          href="/dashboard/tasks"
        />
        <StatCard title="Unpaid invoices" value="—" hint="Coming soon" />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
  href,
}: {
  title: string;
  value: string;
  hint: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {title}
      </p>
      <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{hint}</p>
    </>
  );

  const classes =
    "block rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900";

  if (href) {
    return (
      <Link
        href={href}
        className={`${classes} hover:border-zinc-300 hover:bg-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800`}
      >
        {body}
      </Link>
    );
  }
  return <div className={classes}>{body}</div>;
}
