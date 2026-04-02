import fs from "node:fs";
import readline from "node:readline";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { VectorStore } from "./vector-store.js";

const STORE_PATH = "./store.json";

function loadStore(): VectorStore {
  if (!fs.existsSync(STORE_PATH)) {
    console.error(
      "No vector store found. Run `npm run ingest` first to process documents."
    );
    process.exit(1);
  }
  return VectorStore.deserialize(fs.readFileSync(STORE_PATH, "utf-8"));
}

const SYSTEM_PROMPT = `You are a precise document Q&A assistant. You answer questions based ONLY on the provided context from the user's documents.

Rules:
- Answer using only information from the context chunks provided
- If the context doesn't contain enough info to answer, say so clearly
- Cite which document(s) your answer comes from
- Be concise but thorough
- If asked to summarize, focus on key points from the available context`;

async function answerQuestion(
  store: VectorStore,
  question: string,
  history: Array<{ role: "user" | "assistant"; content: string }>
) {
  const relevantChunks = await store.search(question, 5);

  const context = relevantChunks
    .map(
      (chunk, i) =>
        `[Source: ${chunk.metadata.source}, Chunk ${chunk.metadata.chunkIndex}]\n${chunk.text}`
    )
    .join("\n\n---\n\n");

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    system: SYSTEM_PROMPT,
    messages: [
      ...history,
      {
        role: "user",
        content: `Context from documents:\n\n${context}\n\n---\n\nQuestion: ${question}`,
      },
    ],
  });

  return text;
}

async function main() {
  const store = loadStore();
  console.log(`\n🔍 Document Q&A Agent — ${store.size} chunks loaded`);
  console.log('Type your question (or "quit" to exit)\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const history: Array<{ role: "user" | "assistant"; content: string }> = [];

  const ask = () => {
    rl.question("You: ", async (input) => {
      const question = input.trim();
      if (!question || question.toLowerCase() === "quit") {
        console.log("\nGoodbye!\n");
        rl.close();
        return;
      }

      try {
        const answer = await answerQuestion(store, question, history);
        console.log(`\nAgent: ${answer}\n`);
        history.push(
          { role: "user", content: question },
          { role: "assistant", content: answer }
        );
      } catch (err) {
        console.error("Error:", err);
      }

      ask();
    });
  };

  ask();
}

main().catch(console.error);
