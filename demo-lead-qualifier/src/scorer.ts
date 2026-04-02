import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export const LeadInputSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  company: z.string().optional(),
  role: z.string().optional(),
  message: z.string().optional(),
  source: z.string().optional(),
  website: z.string().optional(),
  companySize: z.string().optional(),
});

export type LeadInput = z.infer<typeof LeadInputSchema>;

export const LeadScoreSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(100)
    .describe("Overall lead quality score from 0-100"),
  tier: z
    .enum(["hot", "warm", "cold", "disqualified"])
    .describe("Lead tier based on score and fit"),
  signals: z
    .array(
      z.object({
        factor: z.string().describe("The scoring factor"),
        impact: z.enum(["positive", "negative", "neutral"]),
        detail: z.string().describe("Brief explanation"),
      })
    )
    .describe("Individual scoring signals that contributed to the score"),
  idealCustomerFit: z
    .number()
    .min(0)
    .max(100)
    .describe("How well this lead matches the ideal customer profile"),
  buyIntent: z
    .number()
    .min(0)
    .max(100)
    .describe("Estimated purchase intent based on message and context"),
  suggestedAction: z
    .enum([
      "immediate_call",
      "send_demo_link",
      "nurture_sequence",
      "send_resources",
      "disqualify",
    ])
    .describe("Recommended next action"),
  personalizedFollowUp: z
    .string()
    .describe("A personalized follow-up message draft for this lead"),
  assignTo: z
    .enum(["sales_lead", "account_executive", "sdr", "marketing_automation"])
    .describe("Who should handle this lead"),
});

export type LeadScore = z.infer<typeof LeadScoreSchema>;

const ICP_CONTEXT = `Ideal Customer Profile (ICP):
- SaaS companies with 10-500 employees
- Using multiple tools/APIs that need integration
- Technical decision-makers (CTO, VP Eng, Lead Developer)
- Annual revenue $1M-$50M
- Pain point: manual processes, disconnected tools, scaling operations

Scoring weights:
- Company fit (size, industry, role): 40%
- Buy intent (message content, urgency signals): 35%
- Engagement quality (detail in message, specific use case): 25%`;

export async function scoreLead(lead: LeadInput): Promise<LeadScore> {
  const leadContext = [
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    lead.company && `Company: ${lead.company}`,
    lead.role && `Role: ${lead.role}`,
    lead.companySize && `Company size: ${lead.companySize}`,
    lead.website && `Website: ${lead.website}`,
    lead.source && `Source: ${lead.source}`,
    lead.message && `Message: ${lead.message}`,
  ]
    .filter(Boolean)
    .join("\n");

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: LeadScoreSchema,
    system: `You are an expert lead qualification AI for a B2B SaaS company.
Score incoming leads based on how well they match the Ideal Customer Profile and their likelihood to convert.

${ICP_CONTEXT}

Be analytical and precise. Explain your scoring reasoning through the signals array.
Write a personalized follow-up that references specific details from their submission.`,
    prompt: `Score this lead:\n\n${leadContext}`,
  });

  return object;
}
