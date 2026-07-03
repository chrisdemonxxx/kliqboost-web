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
    └── rls_verification.sql             # simulates two users, asserts owner-isolation
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

## Verifying RLS (needs a live project)

1. Sign up two users through the app (or the Supabase dashboard).
2. Put their UUIDs into `tests/rls_verification.sql` (`:alice`, `:bob`).
3. Run it in the SQL editor / `psql`. A clean run ending in
   `PASS: RLS owner-isolation verified` means RLS holds; any leak raises an
   exception. The harness rolls back, leaving no test data.

## Still TODO (blocked on credentials + canonical-repo decision)

- **Auth wiring** in the Next.js app: `@supabase/ssr` client, session
  middleware, protected `/dashboard` routes, sign-up/sign-in/sign-out handlers.
  Deferred deliberately — this repo runs a pre-release **Next.js 16.2.10** whose
  conventions differ from training data (see `AGENTS.md`); the middleware/session
  APIs must be written against `node_modules/next/dist/docs/`, and there is
  nothing to run them against until Supabase creds exist.
- Wire `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` /
  `SUPABASE_SERVICE_ROLE_KEY` into the deploy env.
