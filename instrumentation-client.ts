import { initBotId } from "botid/client/core"

/**
 * BotID — client-side initialisation (Next.js 15.3+ via instrumentation-client.ts).
 *
 * Protects the Server Action proxy route that handles all public couplet
 * submissions. BotID injects an invisible proof-of-work token into every
 * matching request; `checkBotId()` in the Server Action verifies it.
 */
initBotId({
  protect: [
    // Server Actions are POSTed to the same page URL or to the dedicated
    // /_next/server-actions path that Next.js routes them through.
    { path: "/campaign/:slug", method: "POST" },
    { path: "/_next/server-actions", method: "POST" },
  ],
})
