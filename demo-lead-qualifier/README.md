# Lead Qualification Agent

AI-powered lead scoring system that qualifies incoming leads against your Ideal Customer Profile, generates personalized follow-ups, and routes to the right team — ready to plug into Zapier, Make, or any webhook-based automation.

## How It Works

```
Form Submission → [AI Scorer] → score + tier + signals
                                       ↓
                                [Route Decision]
                                       ↓
                    ┌──────────┬───────────┬──────────────┐
                    │          │           │              │
               Hot Lead    Warm Lead   Cold Lead    Disqualified
                    │          │           │              │
              Slack alert  Email       Drip         Mark in CRM
              + booking    sequence    campaign
              link
```

### AI Scoring

Each lead gets scored on:
- **ICP Fit** (40%) — company size, role, industry match
- **Buy Intent** (35%) — urgency signals, specific pain points, budget mentions
- **Engagement Quality** (25%) — detail in message, specific use case described

### Output

- **Score**: 0-100 numeric score
- **Tier**: hot / warm / cold / disqualified
- **Signals**: Array of positive/negative factors with explanations
- **Action**: immediate_call, send_demo_link, nurture_sequence, send_resources, disqualify
- **Follow-up**: Personalized message draft referencing their specific submission
- **Routing**: Which team member and which automation triggers

## Quick Start

```bash
npm install
cp .env.example .env   # Add your OpenAI API key

# Run the simulation with sample leads
npm run simulate

# Or start the HTTP API
npm run dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/qualify` | Score and route a lead |
| `GET` | `/leads` | All processed leads |
| `GET` | `/leads/hot` | Hot leads only |
| `GET` | `/stats` | Qualification stats |
| `POST` | `/webhook/form` | Generic form webhook (Typeform, etc.) |

### Qualify a Lead

```bash
curl -X POST http://localhost:3003/qualify \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sarah Chen",
    "email": "sarah@techstartup.io",
    "company": "TechStartup.io",
    "role": "CTO",
    "companySize": "50-100",
    "message": "Need to automate our API integrations, evaluating vendors now",
    "source": "google_ads"
  }'
```

## Zapier / Make Integration

### As a Zapier Webhook Target
1. Set your form tool (Typeform, Tally, etc.) to submit to `POST /webhook/form`
2. The agent scores the lead and returns the tier
3. Use Zapier Paths to branch on `tier`: hot → notify sales, warm → email sequence, etc.

### As a Make HTTP Module
1. Add an HTTP module pointing to `POST /qualify`
2. Map form fields to the lead schema
3. Use a Router to branch based on `score.tier`

## Stack

- TypeScript + Node.js
- Vercel AI SDK (`ai` + `@ai-sdk/openai`)
- GPT-4o-mini (structured output)
- Hono (HTTP server)
- Zod (input/output validation)
