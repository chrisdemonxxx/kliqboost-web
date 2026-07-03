-- LOCAL VERIFICATION SHIM — NOT a migration.
-- Supabase auto-grants table privileges to anon/authenticated/service_role.
-- Without these, the "cannot insert" assertions in rls_verification.sql would
-- pass for the WRONG reason (table-level permission denied) instead of RLS.
-- Replicating the real grant surface makes the test exercise RLS, not GRANTs.
grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth   to anon, authenticated, service_role;

grant select, insert, update, delete
  on all tables in schema public to authenticated, service_role;
grant select on all tables in schema public to anon;

grant usage, select on all sequences in schema public to authenticated, service_role;
