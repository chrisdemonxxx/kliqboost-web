"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

// Browser-side Supabase client for Client Components. Safe to call on every
// render — createBrowserClient is memoized per set of args by the library.
export function createClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example).",
    );
  }
  return createBrowserClient(env.url, env.anonKey);
}
