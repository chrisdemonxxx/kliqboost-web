-- KLI-3 core data model: users, brand_profiles, content_items, subscriptions
-- Credential-free, portable across kliqboost-web / kliqboost-ai (pure Postgres/Supabase SQL).
-- Apply with: supabase db push   (or paste into the Supabase SQL editor)

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- Shared: keep updated_at fresh on every UPDATE ------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- users ----------------------------------------------------------------------
-- 1:1 mirror of auth.users. Row is created automatically on sign-up (see the
-- handle_new_user trigger below), so the app never inserts here directly.
create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Auto-provision a public.users row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- brand_profiles -------------------------------------------------------------
create table if not exists public.brand_profiles (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  name         text not null,
  description  text,
  brand_voice  text,
  website_url  text,
  logo_url     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists brand_profiles_user_id_idx on public.brand_profiles (user_id);

create trigger brand_profiles_set_updated_at
  before update on public.brand_profiles
  for each row execute function public.set_updated_at();

-- content_items --------------------------------------------------------------
-- user_id is denormalized (== brand_profiles.user_id) so RLS is a single-column
-- check and does not require a join on every read.
create table if not exists public.content_items (
  id                uuid primary key default gen_random_uuid(),
  brand_profile_id  uuid not null references public.brand_profiles (id) on delete cascade,
  user_id           uuid not null references public.users (id) on delete cascade,
  kind              text not null default 'post',           -- post | caption | script | ...
  title             text,
  body              text,
  status            text not null default 'draft',          -- draft | scheduled | published | archived
  scheduled_at      timestamptz,
  published_at      timestamptz,
  metadata          jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists content_items_brand_profile_id_idx on public.content_items (brand_profile_id);
create index if not exists content_items_user_id_idx on public.content_items (user_id);
create index if not exists content_items_status_idx on public.content_items (status);

create trigger content_items_set_updated_at
  before update on public.content_items
  for each row execute function public.set_updated_at();

-- subscriptions --------------------------------------------------------------
-- Populated / kept in sync by the Stripe webhook (KLI billing work). One active
-- subscription per user is the expected shape, but the schema does not enforce
-- it so historical/cancelled rows can be retained.
create table if not exists public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references public.users (id) on delete cascade,
  stripe_customer_id     text,
  stripe_subscription_id text unique,
  status                 text not null default 'incomplete', -- trialing | active | past_due | canceled | ...
  price_id               text,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();
