const NAV_ITEMS = [
  { label: "Overview", href: "/", active: true },
  { label: "Campaigns", href: "/campaigns", active: false },
  { label: "Audiences", href: "/audiences", active: false },
  { label: "Analytics", href: "/analytics", active: false },
  { label: "Settings", href: "/settings", active: false },
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-black/10 bg-black/[.02] p-4 md:block dark:border-white/10 dark:bg-white/[.03]">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="h-6 w-6 rounded-md bg-foreground" />
        <span className="text-lg font-semibold tracking-tight">kliqboost</span>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.label}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              item.active
                ? "bg-foreground text-background font-medium"
                : "text-foreground/70 hover:bg-black/[.05] dark:hover:bg-white/[.06]"
            }`}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
