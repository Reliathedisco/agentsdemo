import type { LeadInput, LeadScore } from "./scorer.js";

export interface RoutingDecision {
  webhookTargets: WebhookTarget[];
  crmAction: string;
  notifyChannel?: string;
  tags: string[];
}

interface WebhookTarget {
  name: string;
  description: string;
  payload: Record<string, unknown>;
}

/**
 * Determines where to route a scored lead.
 * In production, these would fire actual webhooks to Zapier/Make/CRM.
 */
export function routeLead(
  lead: LeadInput,
  score: LeadScore
): RoutingDecision {
  const webhookTargets: WebhookTarget[] = [];
  const tags: string[] = [score.tier, score.suggestedAction];

  if (score.tier === "hot") {
    webhookTargets.push({
      name: "slack_notification",
      description: "Alert #sales-hot-leads channel",
      payload: {
        channel: "#sales-hot-leads",
        text: `🔥 Hot lead: ${lead.name} (${lead.company || "Unknown"}) — Score: ${score.score}/100`,
        blocks: [
          {
            type: "section",
            text: `*${lead.name}* from ${lead.company || "Unknown company"}\nScore: ${score.score}/100 | Intent: ${score.buyIntent}%\n${score.signals.filter((s) => s.impact === "positive").map((s) => `✅ ${s.detail}`).join("\n")}`,
          },
        ],
      },
    });

    webhookTargets.push({
      name: "calendar_booking",
      description: "Send calendar booking link via email",
      payload: {
        to: lead.email,
        template: "hot_lead_booking",
        variables: { name: lead.name, company: lead.company },
      },
    });

    tags.push("priority", "fast_track");
  }

  if (score.tier === "warm") {
    webhookTargets.push({
      name: "email_sequence",
      description: "Enroll in warm lead nurture sequence",
      payload: {
        email: lead.email,
        sequence: "warm_lead_nurture",
        personalizedMessage: score.personalizedFollowUp,
      },
    });

    tags.push("nurture");
  }

  if (score.tier === "cold") {
    webhookTargets.push({
      name: "marketing_automation",
      description: "Add to educational drip campaign",
      payload: {
        email: lead.email,
        list: "educational_content",
        source: lead.source,
      },
    });
  }

  webhookTargets.push({
    name: "crm_update",
    description: "Create/update contact in CRM",
    payload: {
      email: lead.email,
      name: lead.name,
      company: lead.company,
      score: score.score,
      tier: score.tier,
      assignedTo: score.assignTo,
      tags,
      notes: score.signals.map((s) => `[${s.impact}] ${s.detail}`).join("; "),
    },
  });

  return {
    webhookTargets,
    crmAction:
      score.tier === "disqualified" ? "mark_disqualified" : "create_or_update",
    notifyChannel:
      score.tier === "hot"
        ? "#sales-hot-leads"
        : score.tier === "warm"
          ? "#sales-pipeline"
          : undefined,
    tags,
  };
}
