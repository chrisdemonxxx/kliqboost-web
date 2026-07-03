-- KLI-3 RLS verification harness.
-- Run in the Supabase SQL editor (or `psql`) AFTER applying the migrations, once
-- credentials exist. It simulates two authenticated users by setting the JWT
-- claim that auth.uid() reads, then asserts owner-isolation. Any failed
-- assertion raises an exception, so a clean run == RLS verified.
--
-- Requires two real auth.users rows. Replace the UUIDs below with two users
-- created via the app's sign-up flow (or `supabase auth` / dashboard).

\set alice '00000000-0000-0000-0000-00000000a11ce'
\set bob   '00000000-0000-0000-0000-0000000000b0b'

begin;

-- Act as the "authenticated" role (RLS enforced; unlike service_role).
set local role authenticated;

-- --- Alice creates a brand profile + content item ---------------------------
set local request.jwt.claims = json_build_object('sub', :'alice', 'role', 'authenticated')::text;

insert into public.brand_profiles (id, user_id, name)
values ('11111111-1111-1111-1111-111111111111', :'alice', 'Alice Co');

insert into public.content_items (brand_profile_id, user_id, title, body)
values ('11111111-1111-1111-1111-111111111111', :'alice', 'Hello', 'Alice draft');

do $$
begin
  if (select count(*) from public.brand_profiles) <> 1 then
    raise exception 'FAIL: Alice should see exactly her 1 brand_profile';
  end if;
end $$;

-- --- Bob must NOT see Alice's rows ------------------------------------------
set local request.jwt.claims = json_build_object('sub', :'bob', 'role', 'authenticated')::text;

do $$
begin
  if (select count(*) from public.brand_profiles) <> 0 then
    raise exception 'FAIL: Bob can see Alice''s brand_profiles (RLS leak)';
  end if;
  if (select count(*) from public.content_items) <> 0 then
    raise exception 'FAIL: Bob can see Alice''s content_items (RLS leak)';
  end if;
end $$;

-- --- Bob cannot write rows owned by Alice -----------------------------------
do $$
begin
  begin
    insert into public.content_items (brand_profile_id, user_id, title)
    values ('11111111-1111-1111-1111-111111111111',
            '00000000-0000-0000-0000-00000000a11ce', 'spoof');
    raise exception 'FAIL: Bob inserted a row owned by Alice (RLS check bypassed)';
  exception
    when insufficient_privilege or check_violation then
      null;  -- expected: WITH CHECK rejects the foreign user_id
  end;
end $$;

-- --- Clients cannot self-edit billing --------------------------------------
do $$
begin
  begin
    insert into public.subscriptions (user_id, status)
    values ('00000000-0000-0000-0000-0000000000b0b', 'active');
    raise exception 'FAIL: client inserted into subscriptions (should be service_role only)';
  exception
    when insufficient_privilege then
      null;  -- expected: no insert policy for authenticated clients
  end;
end $$;

raise notice 'PASS: RLS owner-isolation verified for all customer tables';

rollback;  -- leave no test data behind
