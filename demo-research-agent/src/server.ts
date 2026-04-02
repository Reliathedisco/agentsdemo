import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { runResearchAgent } from "./agent.js";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    agent: "Multi-Step Research Agent",
    model: "Claude Sonnet",
    endpoints: {
      "POST /research": "Start a research task (JSON: { topic: string })",
      "GET /health": "Health check",
    },
  });
});

app.get("/health", (c) => c.json({ status: "ok" }));

app.post("/research", async (c) => {
  const { topic } = await c.req.json<{ topic: string }>();

  if (!topic) {
    return c.json({ error: "Missing 'topic' in request body" }, 400);
  }

  const startTime = Date.now();
  const { report, toolCalls, sources } = await runResearchAgent(topic);
  const durationMs = Date.now() - startTime;

  return c.json({
    topic,
    report,
    metadata: {
      toolCalls,
      sources,
      durationMs,
      model: "claude-sonnet-4-20250514",
    },
  });
});

const port = parseInt(process.env.PORT || "3001");

serve({ fetch: app.fetch, port }, () => {
  console.log(`\n🔬 Research Agent running at http://localhost:${port}\n`);
});
