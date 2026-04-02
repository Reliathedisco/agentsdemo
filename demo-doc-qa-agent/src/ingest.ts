import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";
import pdf from "pdf-parse";
import { chunkText } from "./chunker.js";
import { VectorStore } from "./vector-store.js";

const DOCS_DIR = process.argv[2] || "./docs";
const STORE_PATH = "./store.json";

async function extractText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    const buffer = fs.readFileSync(filePath);
    const data = await pdf(buffer);
    return data.text;
  }

  if ([".txt", ".md", ".csv"].includes(ext)) {
    return fs.readFileSync(filePath, "utf-8");
  }

  console.warn(`Skipping unsupported file type: ${filePath}`);
  return "";
}

async function main() {
  console.log(`\n📂 Scanning ${DOCS_DIR} for documents...\n`);

  const files = await glob(`${DOCS_DIR}/**/*.{pdf,txt,md,csv}`);

  if (files.length === 0) {
    console.log("No documents found. Add PDFs, .txt, or .md files to ./docs/");
    process.exit(1);
  }

  console.log(`Found ${files.length} document(s):\n`);
  files.forEach((f) => console.log(`  • ${f}`));

  const store = new VectorStore();
  let totalChunks = 0;

  for (const file of files) {
    const text = await extractText(file);
    if (!text) continue;

    const chunks = chunkText(text);
    const metadatas = chunks.map((_, i) => ({
      source: path.basename(file),
      chunkIndex: i,
    }));

    console.log(
      `\n  Processing ${path.basename(file)}: ${chunks.length} chunks`
    );
    await store.addDocuments(chunks, metadatas);
    totalChunks += chunks.length;
  }

  fs.writeFileSync(STORE_PATH, store.serialize());
  console.log(
    `\n✅ Ingested ${totalChunks} chunks from ${files.length} files → ${STORE_PATH}\n`
  );
}

main().catch(console.error);
