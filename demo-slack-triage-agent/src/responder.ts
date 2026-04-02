import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import type { Classification } from "./classifier.js";

export interface DraftResponse {
  message: string;
  requiresApproval: boolean;
  approvalReason?: string;
}

export async function draftResponse(
  originalMessage: string,
  classification: Classification
): Promise<DraftResponse> {
  const requiresApproval =
    classification.urgency === "critical" ||
    classification.sentiment === "angry" ||
    classification.suggestedAction === "escalate_to_human" ||
    classification.confidence < 0.7;

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: `You are a helpful, professional support agent for a SaaS company.
Draft a response to a Slack message based on the classification provided.

Tone guidelines:
- For frustrated/angry users: empathetic, acknowledge the issue, commit to resolution
- For bug reports: confirm you've noted the issue, ask for reproduction steps if needed
- For feature requests: thank them, explain next steps
- For urgent issues: acknowledge urgency, provide immediate next steps
- For general questions: be helpful and concise

Keep responses under 150 words. Be genuine, not robotic.`,
    prompt: `Classification:
- Intent: ${classification.intent}
- Urgency: ${classification.urgency}
- Sentiment: ${classification.sentiment}
- Summary: ${classification.summary}
- Route to: ${classification.routeTo}

Original message:
${originalMessage}

Draft an appropriate response:`,
  });

  let approvalReason: string | undefined;
  if (requiresApproval) {
    const reasons = [];
    if (classification.urgency === "critical")
      reasons.push("critical urgency");
    if (classification.sentiment === "angry") reasons.push("angry sentiment");
    if (classification.suggestedAction === "escalate_to_human")
      reasons.push("escalation recommended");
    if (classification.confidence < 0.7)
      reasons.push(`low confidence (${(classification.confidence * 100).toFixed(0)}%)`);
    approvalReason = reasons.join(", ");
  }

  return {
    message: text,
    requiresApproval,
    approvalReason,
  };
}
