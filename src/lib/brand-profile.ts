// Shape of a row in public.brand_profiles (see supabase/migrations). This is the
// context object every AI generation will read, so keep it in sync with the DB.
export type BrandProfile = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  products_services: string | null;
  target_audience: string | null;
  brand_voice: string | null; // tone of voice
  key_messages: string[];
  banned_phrases: string[];
  website_url: string | null;
  created_at: string;
  updated_at: string;
};

// Columns selected for the brand-profile screens.
export const BRAND_PROFILE_COLUMNS =
  "id, user_id, name, description, products_services, target_audience, brand_voice, key_messages, banned_phrases, website_url, created_at, updated_at";

// Textareas collect one item per line; store as a clean string[].
export function linesToArray(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function arrayToLines(value: string[] | null | undefined): string {
  return (value ?? []).join("\n");
}
