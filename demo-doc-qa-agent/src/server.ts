import fs from "node:fs";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { openai } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";
import { VectorStore } from "./vector-store.js";

const STORE_PATH = "./store.json";

function loadStore(): VectorStore {
  if (!fs.existsSync(STORE_PATH)) {
    console.error("No vector store found. Run `npm run ingest` first.");
    process.exit(1);
  }
  return VectorStore.deserialize(fs.readFileSync(STORE_PATH, "utf-8"));
}

const store = loadStore();
const app = new Hono();

const SYSTEM_PROMPT = `You are a precise document Q&A assistant. Answer questions based ONLY on the provided context. Cite sources. If the context doesn't contain enough info, say so.`;

app.get("/", (c) => {
  return c.json({
    agent: "Document Q&A Agent",
    chunks_loaded: store.size,
    endpoints: {
      "POST /ask": "Ask a question (JSON body: { question: string })",
      "POST /ask/stream":
        "Ask with streaming response (JSON body: { question: string })",
      "GET /health": "Health check",
    },
  });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", chunks: store.size });
});

app.post("/ask", async (c) => {
  const { question } = await c.req.json<{ question: string }>();

  if (!question) {
    return c.json({ error: "Missing 'question' in request body" }, 400);
  }

  const relevantChunks = await store.search(question, 5);

  const context = relevantChunks
    .map(
      (chunk) =>
        `[Source: ${chunk.metadata.source}]\n${chunk.text}`
    )
    .join("\n\n---\n\n");

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Context:\n\n${context}\n\n---\n\nQuestion: ${question}`,
      },
    ],
  });

  return c.json({
    answer: text,
    sources: relevantChunks.map((ch) => ({
      source: ch.metadata.source,
      chunk: ch.metadata.chunkIndex,
      preview: ch.text.slice(0, 150) + "...",
    })),
  });
});

app.post("/ask/stream", async (c) => {
  const { question } = await c.req.json<{ question: string }>();

  if (!question) {
    return c.json({ error: "Missing 'question' in request body" }, 400);
  }

  const relevantChunks = await store.search(question, 5);

  const context = relevantChunks
    .map(
      (chunk) =>
        `[Source: ${chunk.metadata.source}]\n${chunk.text}`
    )
    .join("\n\n---\n\n");

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Context:\n\n${context}\n\n---\n\nQuestion: ${question}`,
      },
    ],
  });

  return result.toDataStreamResponse();
});

const port = parseInt(process.env.PORT || "3000");

serve({ fetch: app.fetch, port }, () => {
  console.log(`\n🚀 Document Q&A Agent running at http://localhost:${port}`);
  console.log(`   ${store.size} chunks loaded\n`);
});
