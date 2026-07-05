# Supabase — KLI-3 auth & core data model

This directory holds the **credential-free** half of KLI-3: the core schema, RLS
policies, and an RLS verification harness. All of it is portable — pure
Postgres/Supabase SQL that applies unchanged to whichever repo becomes canonical
(`kliqboost-web` or `kliqboost-ai`).

## Layout

```
supabase/
├── migrations/
│   ├── 20260703120000_core_schema.sql        # users, brand_profiles, content_items, subscriptions + triggers
│   ├── 20260703120100_rls_policies.sql       # RLS enabled + owner-scoped policies on every customer table
│   └── 20260705120000_brand_profile_fields.sql  # KLI-4: product/audience/messaging columns + one-profile-per-user
└── tests/
    └── rls_verification.sql                  # simulates two users, asserts owner-isolation
```

### `brand_profiles` columns (after KLI-4)

`id`, `user_id`, `name`, `description`, `products_services`, `target_audience`,
`brand_voice` (tone of voice), `key_messages text[]`, `banned_phrases text[]`,
`website_url`, `logo_url`, timestamps. A unique index on `user_id` keeps the
profile screen a simple upsert (one brand profile per user for the MVP).

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

## Auth wiring (done — KLI-4)

The Next.js app now has the `@supabase/ssr` layer, written against this repo's
pre-release **Next.js 16.2.10** docs (see `AGENTS.md`):

- `src/lib/supabase/{client,server,proxy,env}.ts` — browser/server clients.
- `src/proxy.ts` — Next 16 renamed `middleware` → **`proxy`**; refreshes the
  session cookie every request and guards `/brand-profile`.
- `src/app/login/` — email/password sign-up, sign-in; `signOut` in the topbar.
- `src/app/brand-profile/` — the KLI-4 CRUD screen (upsert against `brand_profiles`).

All of it degrades gracefully when Supabase env vars are absent (home route
still renders; protected routes redirect to `/login`), so the app builds and
runs credential-free. Live end-to-end auth needs real credentials.

## Still TODO (blocked on credentials)

- Wire `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` /
  `SUPABASE_SERVICE_ROLE_KEY` into `.env.local` (see `.env.example`) and the
  deploy env, then `supabase db push` the three migrations.
- Live-verify sign-up → create/edit/view brand profile, and the RLS harness.
