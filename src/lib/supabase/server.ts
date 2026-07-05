import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

// Per-request Supabase client for Server Components, Server Actions and Route
// Handlers. Must be created fresh for every request (cookies() is request-bound).
// Returns null when Supabase is not configured so callers can degrade instead of
// crashing the whole render (the home route works without credentials).
export async function createClient() {
  const env = getSupabaseEnv();
  if (!env) return null;

  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll was called from a Server Component, where cookies are
          // read-only. Safe to ignore — the proxy refreshes the session cookie
          // on every request, so tokens still stay current.
        }
      },
    },
  });
}
