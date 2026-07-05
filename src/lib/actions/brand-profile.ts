"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { linesToArray } from "@/lib/brand-profile";

export type BrandProfileState = { error: string | null; ok: boolean };

// Create-or-update the signed-in user's brand profile. One row per user, so this
// is a single upsert keyed on user_id. RLS guarantees a user can only write their
// own row, but we also set user_id explicitly so insert passes the WITH CHECK.
export async function saveBrandProfile(
  _prev: BrandProfileState,
  formData: FormData,
): Promise<BrandProfileState> {
  const supabase = await createClient();
  if (!supabase)
    return { ok: false, error: "Supabase is not configured yet." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Brand name is required." };

  const emptyToNull = (v: FormDataEntryValue | null) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : s;
  };

  const row = {
    user_id: user.id,
    name,
    description: emptyToNull(formData.get("description")),
    products_services: emptyToNull(formData.get("products_services")),
    target_audience: emptyToNull(formData.get("target_audience")),
    brand_voice: emptyToNull(formData.get("brand_voice")),
    website_url: emptyToNull(formData.get("website_url")),
    key_messages: linesToArray(formData.get("key_messages")),
    banned_phrases: linesToArray(formData.get("banned_phrases")),
  };

  const { error } = await supabase
    .from("brand_profiles")
    .upsert(row, { onConflict: "user_id" });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/brand-profile");
  return { ok: true, error: null };
}
