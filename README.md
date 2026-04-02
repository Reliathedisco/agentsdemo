# AI Workflow Agent Demos

Production-grade AI agent demos showcasing custom automation systems — from RAG pipelines to agentic tool-calling loops to intelligent message triage.

Built with TypeScript, Vercel AI SDK, OpenAI, Anthropic, and Hono.

---

## Projects

### 1. [Document Q&A Agent](./demo-doc-qa-agent/)
RAG pipeline that ingests PDFs and documents, creates embeddings, and answers natural-language questions with source citations.

**Stack:** TypeScript, OpenAI (embeddings + GPT-4o-mini), Vercel AI SDK, Hono  
**Highlights:** Chunking with overlap, cosine similarity search, streaming API, CLI + HTTP

```bash
cd demo-doc-qa-agent && npm install && npm run ingest && npm run chat
```

---

### 2. [Multi-Step Research Agent](./demo-research-agent/)
Autonomous agent that searches the web, reads articles, takes structured notes, and produces comprehensive research reports.

**Stack:** TypeScript, Anthropic Claude (tool calling), Vercel AI SDK, Hono, Zod  
**Highlights:** Agentic loop (up to 15 steps), web search + page fetch + notepad tools, zero hardcoded workflow

```bash
cd demo-research-agent && npm install && npm run research -- "Your topic here"
```

---

### 3. [Slack Triage Agent](./demo-slack-triage-agent/)
Intelligent message classifier that categorizes Slack messages by intent, urgency, and sentiment — drafts responses with human-in-the-loop approval for sensitive cases.

**Stack:** TypeScript, Anthropic Claude (structured output), Vercel AI SDK, Hono, Zod  
**Highlights:** 6-dimension classification, confidence-gated auto-response, approval workflow, Slack webhook ready

```bash
cd demo-slack-triage-agent && npm install && npm run simulate
```

---

### 4. [Lead Qualification Agent](./demo-lead-qualifier/)
AI-powered lead scoring against your Ideal Customer Profile — generates personalized follow-ups and routes to the right team via webhooks.

**Stack:** TypeScript, OpenAI GPT-4o-mini (structured output), Vercel AI SDK, Hono, Zod  
**Highlights:** ICP-based scoring, multi-signal analysis, webhook routing (Zapier/Make ready), form webhook endpoint

```bash
cd demo-lead-qualifier && npm install && npm run simulate
```

---

## Architecture Patterns Demonstrated

| Pattern | Demo |
|---------|------|
| RAG (Retrieval-Augmented Generation) | Document Q&A |
| Agentic tool-calling loop | Research Agent |
| Structured output / classification | Slack Triage, Lead Qualifier |
| Human-in-the-loop | Slack Triage |
| Webhook integration (Zapier/Make) | Lead Qualifier |
| Streaming responses | Document Q&A |
| Multi-step autonomous reasoning | Research Agent |

## Tech Stack

- **Runtime:** Node.js 22 + TypeScript
- **AI:** Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`)
- **Models:** GPT-4o-mini, Claude Sonnet
- **HTTP:** Hono
- **Validation:** Zod
- **PDF:** pdf-parse
