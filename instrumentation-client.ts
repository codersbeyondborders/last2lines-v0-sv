import { initBotId } from "botid/client/core"

/**
 * BotID — client-side initialisation (Next.js 15.3+ via instrumentation-client.ts).
 *
 * Next.js Server Actions are POSTed to the same page URL that rendered the
 * form (e.g. POST /campaign/two-lines-earth). KPSDK uses glob-style wildcards
 * (not Express :param syntax), so we use /campaign/* to match all campaign
 * slugs. BotID intercepts those requests and injects the x-is-human header;
 * checkBotId() in the Server Action verifies it server-side.
 */
initBotId({
  protect: [
    { path: "/campaign/*", method: "POST" },
  ],
})
