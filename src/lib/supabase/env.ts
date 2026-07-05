// Central place to read Supabase config. Returns null when the project has not
// been configured yet, so the app can build and the marketing/home routes can
// render without live credentials (see the proxy and server client, which both
// no-op when this returns null).
export function getSupabaseEnv(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}
