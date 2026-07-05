-- KLI-3 row-level security. Every customer table is owner-scoped: a signed-in
-- user (auth.uid()) may only read/write rows they own. The service_role key
-- bypasses RLS, so server-side webhooks (Stripe -> subscriptions) still work.

-- users ----------------------------------------------------------------------
alter table public.users enable row level security;

create policy "users: select own"
  on public.users for select
  using (auth.uid() = id);

create policy "users: update own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
-- No insert/delete policy: rows are managed by the handle_new_user trigger and
-- ON DELETE CASCADE from auth.users. Clients cannot insert or delete directly.

-- brand_profiles -------------------------------------------------------------
alter table public.brand_profiles enable row level security;

create policy "brand_profiles: select own"
  on public.brand_profiles for select
  using (auth.uid() = user_id);

create policy "brand_profiles: insert own"
  on public.brand_profiles for insert
  with check (auth.uid() = user_id);

create policy "brand_profiles: update own"
  on public.brand_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "brand_profiles: delete own"
  on public.brand_profiles for delete
  using (auth.uid() = user_id);

-- content_items --------------------------------------------------------------
alter table public.content_items enable row level security;

create policy "content_items: select own"
  on public.content_items for select
  using (auth.uid() = user_id);

create policy "content_items: insert own"
  on public.content_items for insert
  with check (auth.uid() = user_id);

create policy "content_items: update own"
  on public.content_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "content_items: delete own"
  on public.content_items for delete
  using (auth.uid() = user_id);

-- subscriptions --------------------------------------------------------------
-- Read-only to the owner. Writes happen exclusively via the service_role key in
-- the Stripe webhook, which bypasses RLS, so no insert/update/delete policy is
-- granted to authenticated clients (they must never self-edit billing state).
alter table public.subscriptions enable row level security;

create policy "subscriptions: select own"
  on public.subscriptions for select
  using (auth.uid() = user_id);
