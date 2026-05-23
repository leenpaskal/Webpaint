import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <span className="mb-6 inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            Webpaint Portal
          </span>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl md:text-6xl dark:text-zinc-50">
            {user
              ? `Welcome back, ${user.name.split(" ")[0]}.`
              : "Run your web agency from a single dashboard."}
          </h1>
          <p className="mt-6 max-w-2xl text-base text-zinc-600 sm:text-lg dark:text-zinc-400">
            {user
              ? "Jump back into your workspace to manage clients, websites, projects, invoices and payments."
              : "Welcome to Webpaint — manage clients, websites, projects, invoices and payments in one clean, modern workspace built for small teams and freelancers."}
          </p>

          <div className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center rounded-md bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 sm:w-auto sm:min-w-45 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-zinc-300 bg-white px-6 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 sm:w-auto sm:min-w-35 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-800 sm:w-auto sm:min-w-35 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mt-16 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="Clients & websites"
            description="Keep every client, website and service contract organised in one searchable place."
          />
          <FeatureCard
            title="Tasks & projects"
            description="Plan maintenance and project work with clear statuses and deadlines."
          />
          <FeatureCard
            title="Invoices & payments"
            description="Track invoices, retainers and payment status so nothing slips through."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}
