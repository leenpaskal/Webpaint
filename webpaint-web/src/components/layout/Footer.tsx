import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

export default async function Footer() {
  const user = await getCurrentUser();
  const year = new Date().getFullYear();

  const links = user
    ? [
        { href: "/", label: "Home" },
        { href: "/dashboard", label: "Dashboard" },
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/login", label: "Log in" },
      ];

  return (
    <footer className="mt-auto w-full border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-zinc-600 sm:px-6 md:flex-row lg:px-8 dark:text-zinc-400">
        <p className="text-center md:text-left">
          &copy; {year} Webpaint. All rights reserved.
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-zinc-900 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
