import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { createClient } from "@/lib/supabase/server";
import { BRAND_PROFILE_COLUMNS, type BrandProfile } from "@/lib/brand-profile";
import { BrandProfileForm } from "./brand-profile-form";

export const metadata = {
  title: "Brand profile · kliqboost",
};

// Auth- and cookie-dependent: never statically cache this route.
export const dynamic = "force-dynamic";

export default async function BrandProfilePage() {
  const supabase = await createClient();
  // The proxy already guards this route, but verify here too: Server Actions and
  // direct requests must never rely on the proxy alone.
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

  return (
    <div className="flex flex-1">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar title="Brand profile" email={user.email} />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              Brand profile
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-foreground/60">
              This is the context every AI generation uses. The more specific you
              are, the more on-brand your content will be.
              {profile ? null : " You haven’t set up a profile yet — start below."}
            </p>
          </div>
          <BrandProfileForm profile={profile ?? null} />
        </main>
      </div>
    </div>
  );
}
