import { signOut } from "@/lib/actions/auth";

export function Topbar({
  title = "Overview",
  email,
}: {
  title?: string;
  email?: string | null;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-black/10 px-6 dark:border-white/10">
      <div className="flex items-center gap-2">
        <span className="font-medium md:hidden">kliqboost</span>
        <h1 className="hidden text-sm font-medium text-foreground/70 md:block">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {email ? (
          <>
            <span className="hidden text-xs text-foreground/60 sm:inline">
              {email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-black/10 px-3 py-1 text-xs text-foreground/70 transition-colors hover:bg-black/[.05] dark:border-white/10 dark:hover:bg-white/[.06]"
              >
                Sign out
              </button>
            </form>
          </>
        ) : (
          <span className="rounded-full border border-black/10 px-3 py-1 text-xs text-foreground/60 dark:border-white/10">
            hello-world
          </span>
        )}
        <div
          className="h-8 w-8 rounded-full bg-foreground/10"
          aria-hidden
          title="Account"
        />
      </div>
    </header>
  );
}
