import { redirect } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { createClient } from "@/lib/supabase/server";
import { BRAND_PROFILE_COLUMNS, type BrandProfile } from "@/lib/brand-profile";
import { CONTENT_ITEM_COLUMNS, type ContentItem } from "@/lib/content-item";
import { StudioWorkspace } from "./studio-workspace";

export const metadata = {
  title: "AI studio · kliqboost",
};

// Auth- and cookie-dependent: never statically cache this route.
export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const supabase = await createClient();
  // The proxy guards this route, but verify here too — Server Actions and direct
  // requests must never rely on the proxy alone.
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("brand_profiles")
    .select(BRAND_PROFILE_COLUMNS)
    .eq("user_id", user.id)
    .maybeSingle<BrandProfile>();

  const { data: drafts } = await supabase
    .from("content_items")
    .select(CONTENT_ITEM_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)
    .returns<ContentItem[]>();

  return (
    <div className="flex flex-1">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar title="AI studio" email={user.email} />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">AI studio</h2>
            <p className="mt-1 max-w-2xl text-sm text-foreground/60">
              Generate on-brand social posts, ad copy, and SEO outlines from your
              brand profile. Edit, refine, and save drafts.
            </p>
          </div>

          {profile ? (
            <StudioWorkspace recentDrafts={drafts ?? []} />
          ) : (
            <div className="max-w-2xl rounded-lg border border-black/10 p-6 text-sm dark:border-white/10">
              <p className="font-medium">Set up your brand profile first</p>
              <p className="mt-1 text-foreground/60">
                The studio grounds every generation in your brand. It only takes a
                minute.
              </p>
              <Link
                href="/brand-profile"
                className="mt-4 inline-flex rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
              >
                Go to brand profile
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
