import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { LeadInputSchema, scoreLead } from "./scorer.js";
import { routeLead } from "./router.js";

const app = new Hono();
const processedLeads: Array<{
  lead: any;
  score: any;
  routing: any;
  timestamp: string;
}> = [];

app.get("/", (c) => {
  return c.json({
    agent: "Lead Qualification Agent",
    description:
      "AI-powered lead scoring, routing, and personalized follow-up generation",
    endpoints: {
      "POST /qualify": "Score and route a lead (JSON: lead object)",
      "GET /leads": "View all processed leads",
      "GET /leads/hot": "View hot leads only",
      "GET /stats": "Qualification stats",
      "POST /webhook/form": "Webhook endpoint for form submissions (Typeform, etc.)",
    },
  });
});

app.get("/health", (c) => c.json({ status: "ok" }));

app.post("/qualify", async (c) => {
  const body = await c.req.json();
  const parsed = LeadInputSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { error: "Invalid lead data", details: parsed.error.flatten() },
      400
    );
  }

  const lead = parsed.data;
  const score = await scoreLead(lead);
  const routing = routeLead(lead, score);

  const result = {
    lead,
    score,
    routing,
    timestamp: new Date().toISOString(),
  };

  processedLeads.push(result);
  return c.json(result);
});

app.get("/leads", (c) => {
  return c.json({
    total: processedLeads.length,
    leads: processedLeads,
  });
});

app.get("/leads/hot", (c) => {
  const hot = processedLeads.filter((l) => l.score.tier === "hot");
  return c.json({ total: hot.length, leads: hot });
});

app.get("/stats", (c) => {
  const tiers = { hot: 0, warm: 0, cold: 0, disqualified: 0 };
  let totalScore = 0;

  for (const l of processedLeads) {
    tiers[l.score.tier as keyof typeof tiers]++;
    totalScore += l.score.score;
  }

  return c.json({
    total: processedLeads.length,
    averageScore:
      processedLeads.length > 0
        ? Math.round(totalScore / processedLeads.length)
        : 0,
    tiers,
  });
});

app.post("/webhook/form", async (c) => {
  const body = await c.req.json();

  const lead = {
    name: body.name || body.full_name || "Unknown",
    email: body.email,
    company: body.company || body.organization,
    role: body.role || body.job_title,
    message: body.message || body.comments || body.how_can_we_help,
    source: body.source || "form",
    website: body.website || body.company_website,
    companySize: body.company_size || body.employees,
  };

  const parsed = LeadInputSchema.safeParse(lead);
  if (!parsed.success) {
    return c.json({ error: "Could not parse form submission" }, 400);
  }

  const score = await scoreLead(parsed.data);
  const routing = routeLead(parsed.data, score);

  processedLeads.push({
    lead: parsed.data,
    score,
    routing,
    timestamp: new Date().toISOString(),
  });

  return c.json({ received: true, tier: score.tier, score: score.score });
});

const port = parseInt(process.env.PORT || "3003");

serve({ fetch: app.fetch, port }, () => {
  console.log(
    `\n🎯 Lead Qualification Agent running at http://localhost:${port}\n`
  );
});
