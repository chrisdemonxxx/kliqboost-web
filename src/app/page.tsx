import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

const STATS = [
  { label: "Active campaigns", value: "0", hint: "Get started" },
  { label: "Audience reach", value: "—", hint: "No data yet" },
  { label: "Engagement rate", value: "—", hint: "No data yet" },
  { label: "Scheduled posts", value: "0", hint: "Nothing queued" },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-1">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
            <p className="mt-1 text-sm text-foreground/60">
              Welcome to kliqboost. This is the hello-world shell — real widgets
              land here next.
            </p>
          </div>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-black/10 p-5 dark:border-white/10"
              >
                <p className="text-sm text-foreground/60">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-foreground/50">{stat.hint}</p>
              </div>
            ))}
          </section>
          <section className="mt-6 rounded-xl border border-dashed border-black/15 p-10 text-center dark:border-white/15">
            <p className="text-sm text-foreground/60">
              No activity yet. Once campaigns are connected, recent activity
              shows up here.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
