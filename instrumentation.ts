import { registerOTel } from "@vercel/otel"

export function register() {
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
