import { triageMessage, getTriageLog } from "./triage-engine.js";

const SAMPLE_MESSAGES = [
  {
    message:
      "Hey, our production database is down and customers can't log in. This is happening right now and we're losing revenue every minute.",
    channel: "#incidents",
  },
  {
    message:
      "Would be great if we could export reports as CSV. Not urgent, just a nice-to-have for our team.",
    channel: "#feature-requests",
  },
  {
    message:
      "I've been waiting THREE DAYS for a response on my billing issue. This is completely unacceptable. I'm considering canceling our enterprise plan.",
    channel: "#support",
  },
  {
    message:
      "Quick question — how do I set up SSO with our Okta instance? Is there documentation for this?",
    channel: "#support",
  },
  {
    message:
      "Found a bug: when I click 'Save' on the settings page with a long company name (50+ chars), it silently fails. No error message shown.",
    channel: "#bugs",
  },
  {
    message:
      "Just wanted to say the new dashboard redesign is amazing! Really clean and fast. Great work team 🎉",
    channel: "#general",
  },
  {
    message:
      "We noticed a potential security vulnerability — the API endpoint /api/users seems to return full user objects including hashed passwords when called with admin tokens.",
    channel: "#security",
  },
];

async function main() {
  console.log("\n🔔 Slack Triage Agent — Simulation Mode\n");
  console.log("Processing sample messages...\n");
  console.log("=".repeat(70));

  for (const { message, channel } of SAMPLE_MESSAGES) {
    console.log(`\n📨 [${channel}] "${message.slice(0, 80)}..."`);

    const result = await triageMessage(message, channel);

    console.log(`   Intent:    ${result.classification.intent}`);
    console.log(`   Urgency:   ${result.classification.urgency}`);
    console.log(`   Sentiment: ${result.classification.sentiment}`);
    console.log(`   Action:    ${result.classification.suggestedAction}`);
    console.log(`   Route to:  ${result.classification.routeTo}`);
    console.log(
      `   Confidence: ${(result.classification.confidence * 100).toFixed(0)}%`
    );
    console.log(`   Status:    ${result.status}`);

    if (result.draftResponse.requiresApproval) {
      console.log(
        `   ⚠️  Requires approval: ${result.draftResponse.approvalReason}`
      );
    }

    console.log(`\n   Draft response:`);
    console.log(
      `   "${result.draftResponse.message.slice(0, 120)}..."`
    );
    console.log("-".repeat(70));
  }

  const log = getTriageLog();
  console.log("\n📊 Summary:");
  console.log(`   Total processed: ${log.stats.total}`);
  console.log(`   Auto-sent:       ${log.stats.autoSent}`);
  console.log(`   Pending approval: ${log.stats.pendingApproval}`);
  console.log(`   Escalated:       ${log.stats.escalated}`);
  console.log();
}

main().catch(console.error);
