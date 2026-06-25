# Ark Systems Support AI

Production-grade prototype of a Maven AGI support pipeline for **Ark Systems** — a fictional B2B + B2C enterprise hardware and cloud company.

Demonstrates the full support stack: RAG knowledge retrieval, a deterministic business rules engine, mock Salesforce/Zendesk integrations, streaming chat UI, and an FDE debug dashboard.

---

## Prerequisites

```bash
# Node.js v18+ and Ollama must be installed
ollama pull nomic-embed-text   # embeddings
ollama pull qwen3:8b           # chat LLM

ollama list                    # shows all models that are installed locally
```

---

## Run

```bash
ollama serve
ollama ps     # check which models are currently actively being served
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

The backend embeds all 10 knowledge articles on startup (takes ~10s with Ollama running). The server stays up even if Ollama isn't ready — restart once models are pulled.

---

## Request Pipeline

Each chat message passes through a fixed pipeline before the LLM is ever called:

```
POST /chat
  → [1] Customer lookup       (mock Salesforce)
  → [2] embed + cosine search (top-3 KB articles + scores)
  → [3] Rules engine          (6 rules, first match wins)
       ESCALATE → Zendesk ticket + handoff message
       ROUTE    → hardcoded incident macro
       ANSWER   → system prompt + qwen3:8b stream
  → [4] DecisionTrace logged to session store
  → [5] SSE response { token* → done + trace }
```
---

## Test Scenarios

| Customer | Message | Expected |
|---|---|---|
| `consumer-us` | "How do I return my laptop?" | ANSWER — `refundEligibilityRule` |
| `vip-eu` | "I have a billing dispute on my invoice" | ESCALATE — `vipBillingRule`, Zendesk ticket |
| `smb-us` | "What is quantum entanglement?" | ESCALATE — `lowConfidenceRule` (score < 0.4) |
| `enterprise-eu` | "What is your GDPR data retention policy?" | ANSWER — `regulatedTopicRule` |
| `consumer-us` | "Is ArkCloud EU down?" | ROUTE — `knownOutageRule`, incident macro |
| `consumer-us` | "Can I get a refund?" | ANSWER — eligible (purchased 7 days ago) |

---

## Project Structure

```
├── shared/types.ts          # Shared types (DecisionTrace, Customer, etc.)
├── backend/src/
│   ├── server.ts            # Fastify app, port 3001
│   ├── data/                # Mock customers, KB articles, ticket store
│   ├── services/
│   │   ├── ollama.ts        # embed() and chat() — Ollama API wrappers
│   │   ├── knowledge.ts     # Cosine similarity search, article store
│   │   ├── rules.ts         # 6-rule engine + evaluateRules()
│   │   ├── salesforce.ts    # Mock CRM (swap for real API here)
│   │   └── zendesk.ts       # Mock ticketing (swap for real API here)
│   ├── routes/              # /chat, /customers, /sessions, /knowledge/search
│   └── store/sessions.ts    # In-memory session + trace store
└── frontend/src/
    ├── components/Chat/     # CustomerSelector, ChatWindow, TracePanel, EscalationCard
    └── components/Dashboard/ # SessionList, TraceTimeline
```

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + TypeScript, Vite |
| Backend | Fastify + TypeScript, Node.js v18+ |
| LLM | Ollama — `qwen3:8b` |
| Embeddings | Ollama — `nomic-embed-text` |
| Vector search | In-memory cosine similarity |
| Mock integrations | Hardcoded TypeScript (Salesforce, Zendesk) |
