# Supabase — KLI-3 auth & core data model

This directory holds the **credential-free** half of KLI-3: the core schema, RLS
policies, and an RLS verification harness. All of it is portable — pure
Postgres/Supabase SQL that applies unchanged to whichever repo becomes canonical
(`kliqboost-web` or `kliqboost-ai`).

## Layout

```
supabase/
├── migrations/
│   ├── 20260703120000_core_schema.sql   # users, brand_profiles, content_items, subscriptions + triggers
│   └── 20260703120100_rls_policies.sql  # RLS enabled + owner-scoped policies on every customer table
└── tests/
    ├── rls_verification.sql             # simulates two users, asserts owner-isolation
    ├── _local_shim.sql                  # Supabase primitives (auth.uid(), roles) for stock Postgres — verification only
    ├── _local_grants.sql                # replicates Supabase's default table grants — verification only
    └── run.sh                           # applies migrations + shim, seeds users, runs the harness
```

## Data model

| table            | owner column | notes |
|------------------|--------------|-------|
| `users`          | `id`         | 1:1 with `auth.users`; auto-created on sign-up via `handle_new_user` trigger |
| `brand_profiles` | `user_id`    | a user's brands |
| `content_items`  | `user_id`    | belongs to a brand; `user_id` denormalized for cheap RLS |
| `subscriptions`  | `user_id`    | written only by the Stripe webhook (service_role); clients get read-only |

RLS is **enabled on all four tables**. Authenticated clients can only touch rows
where `auth.uid()` matches the owner column. `subscriptions` is read-only to
clients — billing state is mutated exclusively server-side via the service_role
key (which bypasses RLS).

## Applying (needs credentials — currently blocked on KLI-2)

```bash
# Option A: Supabase CLI, linked project
supabase link --project-ref <ref>
supabase db push

# Option B: paste each migration into the Supabase dashboard SQL editor, in order
```

## Verifying RLS — credential-free (verified ✅)

RLS is **verified end-to-end without any Supabase credentials**, against stock
PostgreSQL, using a minimal shim for the Supabase primitives (`auth.uid()`, the
`authenticated`/`service_role` roles, and the default table grants):

```bash
supabase/tests/run.sh                    # bootstraps an ephemeral Postgres
# ...or against an existing database / CI service container:
PSQL_CONN="host=… port=… user=… dbname=…" supabase/tests/run.sh
```

A clean run ends in `PASS: RLS owner-isolation verified` and exits 0; any leak
raises an exception and exits non-zero. The harness runs in a transaction and
rolls back, leaving no data behind. It is wired into CI
(`.github/workflows/rls-verify.yml`), so schema/RLS regressions fail the build.

**What the run proves** (all four customer tables): an authenticated user sees
only their own rows; cannot read or write another user's rows (`WITH CHECK`
enforced); and cannot self-insert `subscriptions` (billing is service_role-only).
A negative control — the same harness with RLS policies removed — fails as
expected (`Bob can see Alice's brand_profiles`), confirming the assertions have
teeth rather than passing vacuously.

> Verified on PostgreSQL 18.1. The shim files (`_local_*.sql`) are **test-only**
> and are never applied to a real Supabase project — Supabase provides those
> primitives natively.

### Against a real Supabase project (post-launch)

The same `rls_verification.sql` runs unchanged in the Supabase SQL editor after
`supabase db push`; just seed two `auth.users` (via the app sign-up flow or the
dashboard) whose ids match `:alice` / `:bob`, or edit those two `\set` lines.

## Still TODO (blocked on credentials + canonical-repo decision)

- **Auth wiring** in the Next.js app: `@supabase/ssr` client, session
  middleware, protected `/dashboard` routes, sign-up/sign-in/sign-out handlers.
  Deferred deliberately — this repo runs a pre-release **Next.js 16.2.10** whose
  conventions differ from training data (see `AGENTS.md`); the middleware/session
  APIs must be written against `node_modules/next/dist/docs/`, and there is
  nothing to run them against until Supabase creds exist.
- Wire `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` /
  `SUPABASE_SERVICE_ROLE_KEY` into the deploy env.
