#!/usr/bin/env bash
# Credential-free RLS verification for the KLI-3 schema.
#
# Applies the migrations + a minimal Supabase shim to a throwaway Postgres,
# seeds two users, and runs the RLS owner-isolation harness. A clean run prints
# "PASS: RLS owner-isolation verified" and exits 0; any leak fails non-zero.
#
# Usage:
#   ./run.sh                       # spins up an ephemeral local cluster
#   PSQL_CONN="host=... dbname=..." ./run.sh   # run against a given database
#
# In CI, point PSQL_CONN at a postgres service container. Locally with no
# Postgres, it bootstraps one via initdb/pg_ctl (found on PATH).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIG="$HERE/../migrations"

EPHEMERAL_DIR=""
cleanup() {
  if [[ -n "$EPHEMERAL_DIR" ]]; then
    pg_ctl -D "$EPHEMERAL_DIR/data" stop -m immediate >/dev/null 2>&1 || true
    rm -rf "$EPHEMERAL_DIR"
  fi
}
trap cleanup EXIT

if [[ -z "${PSQL_CONN:-}" ]]; then
  command -v initdb >/dev/null || { echo "no PSQL_CONN set and initdb not on PATH" >&2; exit 2; }
  EPHEMERAL_DIR="$(mktemp -d)"
  PORT="${PGPORT:-55432}"
  initdb -U postgres -A trust --no-sync -E UTF8 "$EPHEMERAL_DIR/data" >/dev/null
  pg_ctl -D "$EPHEMERAL_DIR/data" \
    -o "-p $PORT -k $EPHEMERAL_DIR -c listen_addresses=127.0.0.1" -w start >/dev/null
  PSQL_CONN="host=127.0.0.1 port=$PORT user=postgres dbname=postgres"
  echo "» ephemeral Postgres on port $PORT"
fi

run() { psql "$PSQL_CONN" -v ON_ERROR_STOP=1 -q "$@"; }

echo "» applying shim + migrations + grants"
run -f "$HERE/_local_shim.sql"
run -f "$MIG/20260703120000_core_schema.sql"
run -f "$MIG/20260703120100_rls_policies.sql"
run -f "$HERE/_local_grants.sql"

echo "» seeding alice + bob (public.users auto-provisioned by trigger)"
run -c "insert into auth.users(id,email) values
  ('00000000-0000-0000-0000-00000000a11c','alice@example.com'),
  ('00000000-0000-0000-0000-000000000b0b','bob@example.com')
  on conflict do nothing;"

echo "» running RLS verification harness"
psql "$PSQL_CONN" -v ON_ERROR_STOP=1 -f "$HERE/rls_verification.sql"
echo "✓ RLS verified"
