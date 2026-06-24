import { updateSession } from "@/lib/supabase/proxy"
import { type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Only run the Supabase session refresh on routes that actually need auth:
     * - /dashboard and all sub-routes  (protected)
     * - /admin and all sub-routes      (protected)
     * - /auth and all sub-routes       (login / callback / error)
     * - /verify-email-result           (post-email-verification redirect)
     * - /api and all sub-routes        (server actions / API handlers)
     *
     * Explicitly excluded (no session needed, saves an extra Supabase round-trip):
     * - /  (homepage)
     * - /campaign/[slug]  (public)
     * - /about, /contact, /terms, /visualize  (public static-ish pages)
     * - _next/static, _next/image, favicon, image assets
     */
    "/dashboard/:path*",
    "/admin/:path*",
    "/auth/:path*",
    "/verify-email-result",
    "/api/:path*",
  ],
}
