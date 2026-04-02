import { Hono } from "hono";
import { serve } from "@hono/node-server";
import {
  triageMessage,
  approveResponse,
  getTriageLog,
  getTriageResult,
} from "./triage-engine.js";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    agent: "Slack Triage Agent",
    description:
      "Classifies messages, drafts responses, and manages human-in-the-loop approval",
    endpoints: {
      "POST /triage": "Triage a message (JSON: { message, channel? })",
      "POST /approve/:id": "Approve a pending response",
      "GET /log": "View full triage log with stats",
      "GET /triage/:id": "Get a specific triage result",
      "GET /pending": "View messages pending approval",
      "POST /webhook/slack": "Slack Events API webhook endpoint",
    },
  });
});

app.get("/health", (c) => c.json({ status: "ok" }));

app.post("/triage", async (c) => {
  const { message, channel } = await c.req.json<{
    message: string;
    channel?: string;
  }>();

  if (!message) {
    return c.json({ error: "Missing 'message' in request body" }, 400);
  }

  const result = await triageMessage(message, channel);
  return c.json(result);
});

app.post("/approve/:id", async (c) => {
  const id = c.req.param("id");
  const result = approveResponse(id);

  if (!result) {
    return c.json(
      { error: "Triage result not found or not pending approval" },
      404
    );
  }

  return c.json({
    approved: true,
    result,
    note: "In production, this would send the response to Slack via the API",
  });
});

app.get("/log", (c) => {
  return c.json(getTriageLog());
});

app.get("/pending", (c) => {
  const log = getTriageLog();
  const pending = log.results.filter((r) => r.status === "pending_approval");
  return c.json({ pending, count: pending.length });
});

app.get("/triage/:id", (c) => {
  const id = c.req.param("id");
  const result = getTriageResult(id);

  if (!result) {
    return c.json({ error: "Triage result not found" }, 404);
  }

  return c.json(result);
});

app.post("/webhook/slack", async (c) => {
  const body = await c.req.json();

  // Slack URL verification challenge
  if (body.type === "url_verification") {
    return c.json({ challenge: body.challenge });
  }

  // Handle message events
  if (body.event?.type === "message" && !body.event?.bot_id) {
    const result = await triageMessage(
      body.event.text,
      body.event.channel
    );

    console.log(
      `[${result.classification.urgency.toUpperCase()}] ${result.classification.intent}: "${result.classification.summary}" → ${result.status}`
    );
  }

  return c.json({ ok: true });
});

const port = parseInt(process.env.PORT || "3002");

serve({ fetch: app.fetch, port }, () => {
  console.log(`\n🔔 Slack Triage Agent running at http://localhost:${port}\n`);
});
