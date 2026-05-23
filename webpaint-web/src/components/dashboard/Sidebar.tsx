"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; exact?: boolean };

const ITEMS: Item[] = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/clients", label: "Clients" },
];

export default function Sidebar() {
  const pathname = usePathname() ?? "";

  const isActive = (item: Item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <nav aria-label="Dashboard">
      {/* Mobile: horizontal tabs */}
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-2 md:hidden">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive(item)
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Desktop: vertical sidebar */}
      <ul className="hidden flex-col gap-1 md:flex md:w-56 md:shrink-0">
        {ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item)
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
