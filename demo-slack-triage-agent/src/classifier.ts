import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";

export const ClassificationSchema = z.object({
  intent: z
    .enum([
      "bug_report",
      "feature_request",
      "support_question",
      "urgent_issue",
      "feedback",
      "general",
    ])
    .describe("The primary intent of the message"),
  urgency: z
    .enum(["critical", "high", "medium", "low"])
    .describe("How urgently this needs attention"),
  sentiment: z
    .enum(["positive", "neutral", "frustrated", "angry"])
    .describe("The emotional tone of the message"),
  summary: z.string().describe("One-sentence summary of the message"),
  suggestedAction: z
    .enum([
      "auto_respond",
      "escalate_to_human",
      "create_ticket",
      "acknowledge_and_queue",
      "no_action",
    ])
    .describe("The recommended action to take"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score for this classification"),
  routeTo: z
    .enum(["engineering", "support", "product", "management", "none"])
    .describe("Which team should handle this"),
});

export type Classification = z.infer<typeof ClassificationSchema>;

export async function classifyMessage(
  message: string,
  channelContext?: string
): Promise<Classification> {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-20250514"),
    schema: ClassificationSchema,
    system: `You are an expert message triage system for a SaaS company's Slack workspace.
Classify incoming messages accurately based on intent, urgency, and sentiment.

Classification guidelines:
- "critical" urgency: production outages, data loss, security issues
- "high" urgency: blocking bugs, frustrated customers, time-sensitive requests
- "medium" urgency: feature requests, non-blocking bugs, general support
- "low" urgency: feedback, general questions, casual messages

- "auto_respond": clear questions with known answers, acknowledgments
- "escalate_to_human": critical issues, angry customers, complex problems
- "create_ticket": bug reports, feature requests that need tracking
- "acknowledge_and_queue": medium-priority items that can wait

Be conservative with confidence — if unsure, rate lower and suggest escalation.`,
    prompt: `${channelContext ? `Channel context: ${channelContext}\n\n` : ""}Message:\n${message}`,
  });

  return object;
}
