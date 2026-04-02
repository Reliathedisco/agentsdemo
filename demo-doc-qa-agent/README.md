# Document Q&A Agent

RAG-powered agent that ingests your documents (PDFs, text, markdown) and lets you ask natural-language questions with source citations.

## How It Works

1. **Ingest** — PDFs and text files are parsed, chunked with overlap, and embedded using OpenAI's `text-embedding-3-small`
2. **Search** — Questions are embedded and matched against document chunks using cosine similarity
3. **Answer** — Relevant chunks are passed as context to GPT-4o-mini, which answers strictly from your documents

## Quick Start

```bash
npm install
cp .env.example .env   # Add your OpenAI API key

# Add documents to ./docs/
mkdir docs
cp /path/to/your/files.pdf ./docs/

# Build the vector store
npm run ingest

# Interactive CLI chat
npm run chat

# Or run as HTTP API
npm run serve
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Agent info and available endpoints |
| `GET` | `/health` | Health check with chunk count |
| `POST` | `/ask` | Ask a question, get JSON response with sources |
| `POST` | `/ask/stream` | Ask with streaming response (AI SDK data stream) |

### Example Request

```bash
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the key findings in the report?"}'
```

### Example Response

```json
{
  "answer": "According to the Q3 report, the key findings are...",
  "sources": [
    {
      "source": "q3-report.pdf",
      "chunk": 3,
      "preview": "Revenue increased 23% year-over-year..."
    }
  ]
}
```

## Architecture

```
docs/ → [PDF Parser] → [Chunker] → [Embeddings] → [Vector Store]
                                                         ↓
                              question → [Embed] → [Similarity Search]
                                                         ↓
                                          [Context + Question] → [LLM] → answer
```

## Production Upgrades

- Swap in-memory vector store for **pgvector** (Supabase/Neon) or **Pinecone**
- Add document metadata filtering (by date, author, category)
- Add conversation memory with session management
- Deploy as a Vercel serverless function or Docker container

## Stack

- TypeScript + Node.js
- Vercel AI SDK (`ai` + `@ai-sdk/openai`)
- Hono (HTTP server)
- pdf-parse (PDF extraction)
