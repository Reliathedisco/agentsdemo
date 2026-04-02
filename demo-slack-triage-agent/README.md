# Slack Triage Agent

Intelligent message triage system that classifies Slack messages by intent, urgency, and sentiment — then drafts contextual responses with human-in-the-loop approval for sensitive cases.

## How It Works

```
Slack Message → [Classify] → intent + urgency + sentiment + confidence
                                    ↓
                            [Draft Response]
                                    ↓
                        ┌─── confidence ≥ 70%? ───┐
                        │                          │
                   Auto-send              Require human approval
                                                   ↓
                                          [Approve / Edit / Reject]
```

### Classification Output

Every message gets structured classification:
- **Intent**: bug_report, feature_request, support_question, urgent_issue, feedback, general
- **Urgency**: critical, high, medium, low
- **Sentiment**: positive, neutral, frustrated, angry
- **Action**: auto_respond, escalate_to_human, create_ticket, acknowledge_and_queue
- **Routing**: engineering, support, product, management

### Human-in-the-Loop

Responses are held for approval when:
- Urgency is **critical**
- Sentiment is **angry**
- Classification recommends **escalation**
- Confidence is **below 70%**

## Quick Start

```bash
npm install
cp .env.example .env   # Add your Anthropic API key

# Run the simulation (no Slack connection needed)
npm run simulate

# Or run the HTTP API
npm run dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/triage` | Classify a message and draft response |
| `POST` | `/approve/:id` | Approve a pending response |
| `GET` | `/log` | Full triage log with stats |
| `GET` | `/pending` | Messages waiting for approval |
| `GET` | `/triage/:id` | Get specific triage result |
| `POST` | `/webhook/slack` | Slack Events API webhook |

### Example

```bash
curl -X POST http://localhost:3002/triage \
  -H "Content-Type: application/json" \
  -d '{"message": "The API has been returning 500 errors for 20 minutes", "channel": "#incidents"}'
```

```json
{
  "id": "triage_1711929600_abc123",
  "classification": {
    "intent": "urgent_issue",
    "urgency": "critical",
    "sentiment": "frustrated",
    "summary": "API returning 500 errors for 20 minutes",
    "suggestedAction": "escalate_to_human",
    "confidence": 0.95,
    "routeTo": "engineering"
  },
  "draftResponse": {
    "message": "I've flagged this as a critical issue and alerted the engineering team...",
    "requiresApproval": true,
    "approvalReason": "critical urgency, escalation recommended"
  },
  "status": "escalated"
}
```

## Connecting to Slack

1. Create a Slack app at [api.slack.com/apps](https://api.slack.com/apps)
2. Enable Event Subscriptions → point to `https://your-domain/webhook/slack`
3. Subscribe to `message.channels` and `message.im` events
4. Add Bot Token Scopes: `chat:write`, `channels:read`, `channels:history`
5. Set `SLACK_BOT_TOKEN` and `SLACK_SIGNING_SECRET` in `.env`

## Stack

- TypeScript + Node.js
- Vercel AI SDK (`ai` + `@ai-sdk/anthropic`)
- Claude Sonnet (structured output + text generation)
- Hono (HTTP server)
- Zod (classification schema)
