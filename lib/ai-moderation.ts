import "server-only"
import { generateText, Output } from "ai"
import { z } from "zod"

/**
 * AI auto-moderation for two-line couplet submissions.
 *
 * Powered by AWS Bedrock (Amazon Nova Micro — the cheapest text model) through
 * the Vercel AI Gateway. The gateway is zero-config in this environment: the
 * Vercel OIDC token authenticates Bedrock automatically, so no provider SDK or
 * API key wiring is required here.
 */

// Cheapest Bedrock text model available through the gateway.
const MODEL = "amazon/nova-micro"

export type ModerationLevel = "lenient" | "standard" | "strict"

export interface CoupletModerationInput {
  lineOne: string
  lineTwo: string
  level: ModerationLevel
  campaignTitle: string
  campaignTheme: string
  campaignDescription: string
}

export interface CoupletModerationResult {
  /** Final recommendation for the contribution. */
  decision: "approve" | "reject" | "review"
  /** 0–1 confidence in the decision. */
  confidence: number
  /** Short, human-readable explanation (shown to admins). */
  reason: string
  /** True when the model errored and we safely fell back to human review. */
  fallback: boolean
}

const ModerationSchema = z.object({
  decision: z
    .enum(["approve", "reject", "review"])
    .describe(
      "approve = clearly safe & on-topic; reject = clearly violates policy; review = uncertain, needs a human.",
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence from 0 to 1 in the chosen decision."),
  reason: z
    .string()
    .describe("One concise sentence explaining the decision, max ~140 chars."),
})

function levelGuidance(level: ModerationLevel): string {
  switch (level) {
    case "lenient":
      return "Be lenient: only reject clear hate speech, explicit sexual content, threats, or spam. When mildly unsure, approve."
    case "strict":
      return "Be strict: reject profanity, insults, off-topic submissions, advertising, personal data, or anything not clearly aligned with the campaign theme. When unsure, choose review."
    case "standard":
    default:
      return "Use balanced judgment: reject hate speech, harassment, explicit content, spam, or clearly off-topic text. When genuinely unsure, choose review."
  }
}

/**
 * Classify a couplet. Never throws — on any failure it returns a safe
 * `review` fallback so submissions are queued for a human instead of lost.
 */
export async function moderateCouplet(
  input: CoupletModerationInput,
): Promise<CoupletModerationResult> {
  const system = [
    "You are a content moderation assistant for a public, collaborative poetry campaign.",
    "Contributors submit a two-line couplet that becomes part of a shared poem.",
    "Evaluate the couplet for safety and relevance to the campaign.",
    levelGuidance(input.level),
    "Respond ONLY with the structured fields requested.",
  ].join(" ")

  const prompt = [
    `Campaign title: ${input.campaignTitle}`,
    `Campaign theme: ${input.campaignTheme}`,
    `Campaign description: ${input.campaignDescription || "(none)"}`,
    "",
    "Submitted couplet:",
    `Line 1: ${input.lineOne}`,
    `Line 2: ${input.lineTwo}`,
  ].join("\n")

  try {
    const { experimental_output } = await generateText({
      model: MODEL,
      system,
      prompt,
      experimental_output: Output.object({ schema: ModerationSchema }),
    })

    return {
      decision: experimental_output.decision,
      confidence: experimental_output.confidence,
      reason: experimental_output.reason,
      fallback: false,
    }
  } catch (err) {
    console.log("[v0] moderateCouplet error:", err)
    return {
      decision: "review",
      confidence: 0,
      reason: "Automated moderation was unavailable; queued for human review.",
      fallback: true,
    }
  }
}
