# Multi-Step Research Agent

Autonomous research agent that takes a topic, searches the web, reads articles, takes structured notes, and produces a comprehensive report — all powered by Claude with tool calling.

## How It Works

```
Topic → [Agent Loop] → Search → Read → Evaluate → Note → ... → Synthesize → Report
          ↑                                                        |
          └────────── up to 15 autonomous steps ──────────────────┘
```

The agent uses a **tool-calling loop** where Claude autonomously decides which tool to use at each step:

1. **webSearch** — Searches DuckDuckGo for information
2. **fetchPage** — Fetches and extracts text from URLs
3. **notepad** — Saves categorized research notes (findings, stats, quotes, counterpoints)

After gathering enough information, the agent synthesizes everything into a structured markdown report with citations.

## Quick Start

```bash
npm install
cp .env.example .env   # Add your Anthropic API key

# CLI research
npm run research -- "Impact of AI agents on SaaS workflows in 2026"

# Or run as HTTP API
npm run serve
```

## API Usage

```bash
# Start the server
npm run serve   # Runs on port 3001

# Submit a research request
curl -X POST http://localhost:3001/research \
  -H "Content-Type: application/json" \
  -d '{"topic": "Best practices for building AI agents in production"}'
```

### Response Format

```json
{
  "topic": "Best practices for building AI agents in production",
  "report": "## Executive Summary\n\n...",
  "metadata": {
    "toolCalls": 12,
    "sources": ["https://..."],
    "durationMs": 15420,
    "model": "claude-sonnet-4-20250514"
  }
}
```

## Architecture

- **Agent loop**: Vercel AI SDK `generateText` with `maxSteps: 15` — the model autonomously chains tool calls
- **Tools**: Defined with Zod schemas for type-safe parameters and structured results
- **No hardcoded workflow**: The agent decides its own research strategy based on the topic

## What This Demonstrates

- Agentic tool-calling loop (not a fixed pipeline)
- Real web search and content extraction
- Structured intermediate state (notepad tool)
- Autonomous multi-step reasoning
- Production-ready HTTP API with metadata

## Stack

- TypeScript + Node.js
- Vercel AI SDK (`ai` + `@ai-sdk/anthropic`)
- Claude Sonnet (tool calling)
- Hono (HTTP server)
- Zod (schema validation)
