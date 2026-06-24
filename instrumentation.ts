// @vercel/otel has a transitive dependency on node:util/types which is not
// available in Edge Runtime. Only register OTel on Node.js runtime, not Edge.
export async function register() {
  // Only run on Node.js runtime, skip on Edge.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerOTel } = await import("@vercel/otel")
    registerOTel({
      serviceName: "last2lines",
      instrumentationConfig: {
        fetch: {
          // Propagate trace context to Supabase and Resend calls so
          // cross-service spans are linked in the Vercel Observability dashboard.
          propagateContextUrls: [
            process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
            "api.resend.com",
          ],
          // Ignore Next.js internal pings and Vercel telemetry noise.
          ignoreUrls: [/_next\//, /vercel\.com\/telemetry/],
        },
      },
    })
  }
}
