/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skew Protection: pins static assets and client-side navigation to the
  // exact deployment that served the initial HTML. When a new deploy goes live
  // while a user is on the page, any stale client will hard-reload instead of
  // loading mismatched JS chunks. Requires "Skew Protection" to also be
  // enabled in Vercel project Settings → Advanced.
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Enable Next.js image optimisation (WebP/AVIF, responsive sizing).
    // Allow images served from Vercel Blob and the local dev server.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
      },
    ],
    // Prefer AVIF for best compression; fallback to WebP.
    formats: ["image/avif", "image/webp"],
  },
}

export default nextConfig
