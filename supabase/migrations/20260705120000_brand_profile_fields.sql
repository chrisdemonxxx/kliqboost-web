-- KLI-4 Brand profile: extend brand_profiles with the fields every AI generation
-- needs as context. The KLI-3 core schema already provides id, user_id, name,
-- description, brand_voice (used as "tone of voice"), website_url, logo_url,
-- timestamps, RLS and the updated_at trigger. This migration only adds the
-- product/audience/messaging columns. Idempotent so it is safe to re-run.

alter table public.brand_profiles
  add column if not exists products_services text,
  add column if not exists target_audience  text,
  add column if not exists key_messages      text[] not null default '{}',
  add column if not exists banned_phrases    text[] not null default '{}';

-- One brand profile per user for the MVP. A partial-free unique constraint keeps
-- the "view / edit my profile" flow a simple upsert on user_id. Drop this if
-- multi-brand support lands later.
create unique index if not exists brand_profiles_user_id_key
  on public.brand_profiles (user_id);

comment on column public.brand_profiles.brand_voice       is 'Tone of voice (KLI-4)';
comment on column public.brand_profiles.products_services is 'What the brand sells / offers (KLI-4)';
comment on column public.brand_profiles.target_audience   is 'Who the brand is for (KLI-4)';
comment on column public.brand_profiles.key_messages      is 'Core messages to reinforce (KLI-4)';
comment on column public.brand_profiles.banned_phrases    is 'Words/phrases the AI must never use (KLI-4)';
