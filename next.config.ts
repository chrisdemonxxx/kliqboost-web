import type { NextConfig } from "next";

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
};

export default nextConfig;
