-- LOCAL VERIFICATION SHIM — NOT a migration, never applied to Supabase.
-- Supabase provides these primitives (auth schema, auth.uid(), the anon/
-- authenticated/service_role roles, and default table grants) out of the box.
-- On stock PostgreSQL they don't exist, so this file recreates the minimum
-- surface the KLI-3 migrations + RLS policies depend on, letting us verify RLS
-- end-to-end without any credentials (see run.sh).

-- Supabase roles (NOLOGIN; the session ROLE is switched via SET ROLE). --------
do $$ begin
  if not exists (select from pg_roles where rolname='anon') then create role anon nologin noinherit; end if;
  if not exists (select from pg_roles where rolname='authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select from pg_roles where rolname='service_role') then create role service_role nologin noinherit bypassrls; end if;
end $$;

-- auth schema + a stand-in for auth.users -------------------------------------
create schema if not exists auth;

create table if not exists auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);

-- Supabase's auth.uid() / auth.role(): read the request.jwt.claims GUC.
create or replace function auth.uid() returns uuid
  language sql stable
as $$ select nullif(current_setting('request.jwt.claims', true)::json ->> 'sub','')::uuid $$;

create or replace function auth.role() returns text
  language sql stable
as $$ select nullif(current_setting('request.jwt.claims', true)::json ->> 'role','')::text $$;

create extension if not exists pgcrypto;  -- gen_random_uuid()
