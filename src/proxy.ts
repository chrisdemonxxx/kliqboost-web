import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 renamed the `middleware` convention to `proxy`. This runs on the
// Node.js runtime and keeps the Supabase session fresh on every request.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Run on all paths except static assets and image files, so auth cookies
    // are refreshed for pages and Server Actions but not for /_next assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
