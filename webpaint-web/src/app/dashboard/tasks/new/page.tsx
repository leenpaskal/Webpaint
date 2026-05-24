import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import ClientTaskForm from "@/components/tasks/ClientTaskForm";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "New task — Webpaint",
};

export default async function NewTaskPage() {
  const user = await requireUser();

  // Only client-portal accounts submit tasks. Anyone else is bounced to
  // the list view (admins / managers don't create tasks themselves).
  if (user.role !== "client" || user.clientId == null) {
    redirect("/dashboard/tasks");
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/dashboard/tasks"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back to tasks
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
          Submit a new task
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Describe what you need and when. The Webpaint team picks it up
          and updates you as it progresses.
        </p>
      </header>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <ClientTaskForm />
      </div>
    </div>
  );
}
