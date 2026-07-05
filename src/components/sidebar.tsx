"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Overview", href: "/" },
  { label: "Brand profile", href: "/brand-profile" },
  { label: "Campaigns", href: "/campaigns" },
  { label: "Audiences", href: "/audiences" },
  { label: "Analytics", href: "/analytics" },
  { label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-black/10 bg-black/[.02] p-4 md:block dark:border-white/10 dark:bg-white/[.03]">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="h-6 w-6 rounded-md bg-foreground" />
        <span className="text-lg font-semibold tracking-tight">kliqboost</span>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-foreground text-background font-medium"
                  : "text-foreground/70 hover:bg-black/[.05] dark:hover:bg-white/[.06]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
