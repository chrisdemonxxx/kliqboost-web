// Shape of a row in public.content_items (see supabase/migrations/…core_schema).
// Drafts saved from the AI studio land here; keep in sync with the DB.
export type ContentItem = {
  id: string;
  brand_profile_id: string;
  user_id: string;
  kind: string; // social_post | ad_copy | seo_article (see CONTENT_TYPES)
  title: string | null;
  body: string | null;
  status: string; // draft | scheduled | published | archived
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

// Columns selected for the studio / drafts screens.
export const CONTENT_ITEM_COLUMNS =
  "id, brand_profile_id, user_id, kind, title, body, status, metadata, created_at, updated_at";
