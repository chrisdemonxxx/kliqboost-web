"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BRAND_PROFILE_COLUMNS, type BrandProfile } from "@/lib/brand-profile";
import { generateContent } from "@/lib/ai/generate";
import { getContentType } from "@/lib/ai/content-types";
import { checkRateLimit } from "@/lib/ai/rate-limit";

// Load the signed-in user's brand profile, or return a typed reason it's absent.
// Shared by both actions: generation needs the profile as context and saving
// needs its id for the content_items foreign key.
async function requireProfile(): Promise<
  | { ok: true; userId: string; profile: BrandProfile }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured yet." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const { data: profile } = await supabase
    .from("brand_profiles")
    .select(BRAND_PROFILE_COLUMNS)
    .eq("user_id", user.id)
    .maybeSingle<BrandProfile>();

  if (!profile) {
    return {
      ok: false,
      error: "Set up your brand profile first — it's the context for generation.",
    };
  }
  return { ok: true, userId: user.id, profile };
}

export type GenerateState = {
  ok: boolean;
  error: string | null;
  text: string | null;
  demo: boolean;
  kind: string | null;
};

// Generate or refine a draft. Guarded by per-user rate limiting; grounded in the
// user's brand profile. Returns the draft text for the client to edit.
export async function generateDraftAction(
  _prev: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  const empty: GenerateState = {
    ok: false,
    error: null,
    text: null,
    demo: false,
    kind: null,
  };

  const kind = String(formData.get("kind") ?? "");
  const type = getContentType(kind);
  if (!type) return { ...empty, error: "Pick a content type." };

  const topic = String(formData.get("topic") ?? "").trim();
  if (!topic) return { ...empty, error: "Describe what to write about.", kind };

  const refine = String(formData.get("refine") ?? "");

  const gate = await requireProfile();
  if (!gate.ok) return { ...empty, error: gate.error, kind };

  const limit = checkRateLimit(gate.userId);
  if (!limit.allowed) {
    return {
      ...empty,
      kind,
      error: `Rate limit reached — try again in ${limit.retryAfterSeconds}s.`,
    };
  }

  const result = await generateContent(gate.profile, type, topic, refine);
  if (!result.ok) return { ...empty, error: result.error, kind };

  return { ok: true, error: null, text: result.text, demo: result.demo, kind };
}

export type SaveState = { ok: boolean; error: string | null };

// Persist an edited draft to content_items. RLS scopes writes to the owner; we
// also set user_id/brand_profile_id explicitly so insert passes WITH CHECK.
export async function saveDraftAction(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const kind = String(formData.get("kind") ?? "");
  const type = getContentType(kind);
  if (!type) return { ok: false, error: "Unknown content type." };

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { ok: false, error: "Nothing to save yet." };

  const gate = await requireProfile();
  if (!gate.ok) return { ok: false, error: gate.error };

  const supabase = await createClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured yet." };

  const titleInput = String(formData.get("title") ?? "").trim();
  // Derive a title from the first line of the body when none is given.
  const title =
    titleInput || body.split("\n")[0].replace(/^#+\s*/, "").slice(0, 120);

  const { error } = await supabase.from("content_items").insert({
    brand_profile_id: gate.profile.id,
    user_id: gate.userId,
    kind: type.id,
    title,
    body,
    status: "draft",
    metadata: { content_type: type.id },
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/studio");
  return { ok: true, error: null };
}
