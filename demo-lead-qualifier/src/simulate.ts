import { scoreLead, type LeadInput } from "./scorer.js";
import { routeLead } from "./router.js";

const SAMPLE_LEADS: LeadInput[] = [
  {
    name: "Sarah Chen",
    email: "sarah@techstartup.io",
    company: "TechStartup.io",
    role: "CTO",
    companySize: "50-100",
    message:
      "We're integrating 12 different APIs and spending 20+ hours a week on manual data syncing between our tools. Need an automated solution ASAP. Currently evaluating 3 vendors.",
    source: "google_ads",
    website: "https://techstartup.io",
  },
  {
    name: "Mike Johnson",
    email: "mike@gmail.com",
    message: "Just checking things out, looks interesting!",
    source: "organic",
  },
  {
    name: "Lisa Park",
    email: "lisa.park@enterprisecorp.com",
    company: "EnterpriseCorp",
    role: "VP of Engineering",
    companySize: "200-500",
    message:
      "We need to automate our customer onboarding pipeline. Currently it takes 3 days to manually set up each new client. Looking for a solution that can integrate with Salesforce, HubSpot, and our internal tools.",
    source: "linkedin_campaign",
    website: "https://enterprisecorp.com",
  },
  {
    name: "Alex Rivera",
    email: "alex@freelancer.dev",
    role: "Freelance Developer",
    message:
      "I'm a solo developer. Do you have a free tier? I just need basic API access for a side project.",
    source: "product_hunt",
  },
  {
    name: "Jordan Williams",
    email: "jwilliams@growthsaas.co",
    company: "GrowthSaaS",
    role: "Head of Operations",
    companySize: "30-50",
    message:
      "Our team manually processes 500+ support tickets/day and routes them to different teams. We need AI-powered classification and automated routing. Budget approved, need to ship this quarter.",
    source: "referral",
    website: "https://growthsaas.co",
  },
];

async function main() {
  console.log("\n🎯 Lead Qualification Agent — Simulation\n");
  console.log("=".repeat(70));

  const results = [];

  for (const lead of SAMPLE_LEADS) {
    console.log(`\n📋 Processing: ${lead.name} (${lead.company || "No company"})`);

    const score = await scoreLead(lead);
    const routing = routeLead(lead, score);

    const tierEmoji =
      score.tier === "hot"
        ? "🔥"
        : score.tier === "warm"
          ? "🌤️"
          : score.tier === "cold"
            ? "❄️"
            : "⛔";

    console.log(`   ${tierEmoji} Tier: ${score.tier.toUpperCase()} (Score: ${score.score}/100)`);
    console.log(`   ICP Fit: ${score.idealCustomerFit}% | Buy Intent: ${score.buyIntent}%`);
    console.log(`   Action: ${score.suggestedAction} → Assign to: ${score.assignTo}`);
    console.log(`   Signals:`);
    for (const signal of score.signals.slice(0, 3)) {
      const icon =
        signal.impact === "positive"
          ? "✅"
          : signal.impact === "negative"
            ? "❌"
            : "➖";
      console.log(`     ${icon} ${signal.detail}`);
    }
    console.log(`   Webhooks triggered: ${routing.webhookTargets.map((w) => w.name).join(", ")}`);
    console.log(`   Follow-up preview: "${score.personalizedFollowUp.slice(0, 100)}..."`);
    console.log("-".repeat(70));

    results.push({ lead: lead.name, tier: score.tier, score: score.score });
  }

  console.log("\n📊 Summary:\n");
  console.log("  Name                  | Tier          | Score");
  console.log("  " + "-".repeat(55));
  for (const r of results) {
    console.log(
      `  ${r.lead.padEnd(22)} | ${r.tier.padEnd(13)} | ${r.score}/100`
    );
  }
  console.log();
}

main().catch(console.error);
