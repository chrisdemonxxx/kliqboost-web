import type { NextConfig } from "next";

// This repo is retired (KLI-15). kliqboost ships from chrisdemonxxx/kliqboost-ai
// to https://kliqboost-app.vercel.app, but this repo kept deploying a months-old
// scaffold — whose landing has no working signup — to a URL people can find and
// share. Serve a redirect to the real app instead of a dead end.
//
// 307, not 308: a permanent redirect is cached by browsers indefinitely, so it
// could not be taken back. A 307 is not cached, which keeps `git revert` of this
// commit a real undo.
const CANONICAL_APP_URL = "https://kliqboost-app.vercel.app";

// Static export is opt-in via STATIC_EXPORT so the default `next build`
// (e.g. on Vercel or a Node server) stays a normal build. The GitHub Pages
// deploy workflow sets STATIC_EXPORT=1 and NEXT_PUBLIC_BASE_PATH=/<repo>.
const staticExport = Boolean(process.env.STATIC_EXPORT);
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  ...(staticExport ? { output: "export", trailingSlash: true } : {}),
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  // A static export drops `redirects()` silently (it needs a server), so the
  // Pages mirror publishes its own redirect page from deploy-pages.yml.
  ...(staticExport
    ? {}
    : {
        async redirects() {
          return [
            {
              source: "/:path*",
              destination: `${CANONICAL_APP_URL}/:path*`,
              permanent: false,
            },
          ];
        },
      }),
};

export default nextConfig;
