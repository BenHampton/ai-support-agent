# Ark Systems Support AI

Production-grade prototype of a support agent for **Ark Systems** — a fictional B2B + B2C enterprise hardware and cloud company.

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

On startup the backend splits the 10 knowledge-base docs into ~38 overlapping chunks and embeds each one (takes ~10s with Ollama running). The server stays up even if Ollama isn't ready — restart once models are pulled.

---

## Request Orchestration

Each chat message passes through a fixed orchestration flow before the LLM is ever called:

```
POST /chat
  → [1] Customer lookup       (mock Salesforce)
  → [2] embed + cosine search (top-5 KB chunks + scores)
  → [3] Rules engine          (6 rules, first match wins)
       ESCALATE → Zendesk ticket + handoff message
       ROUTE    → hardcoded incident macro
       ANSWER   → system prompt + qwen3:8b stream
  → [4] DecisionTrace logged to session store
  → [5] SSE response { token* → done + trace }
```
---

## Architecture Notes

### Knowledge chunking

Retrieval operates at sub-document granularity, not whole documents:

- **Ingestion** — `initKnowledge()` splits each KB doc into chunks via a hybrid
  strategy: split on `##` headings, then window-split any oversized section into
  overlapping windows. Each chunk is embedded independently. Whole-doc embedding
  is the naive baseline; chunking is the production path for longer, less-structured
  documents, giving precision retrieval at the section level.
- **Retrieval** — `searchKnowledge()` ranks all chunks by cosine similarity and
  returns the top-5. `buildSystemPrompt()` then injects only the matched chunk text
  (grouped under each doc title) into the LLM prompt — keeping context focused and
  within token limits rather than dumping entire documents.

---

## Test Scenarios

| Customer | Message | Expected |
|---|---|---|
| `consumer-us` | "How do I return my laptop?" | ANSWER — `refundEligibilityRule` |
| `vip-eu` | "I have a billing dispute on my invoice" | ESCALATE — `vipBillingRule`, Zendesk ticket |
| `smb-us` | "What is quantum entanglement?" | ESCALATE — `lowConfidenceRule` (score < 0.5) |
| `enterprise-eu` | "What is your GDPR data retention policy?" | ANSWER — `regulatedTopicRule` |
| `consumer-us` | "Is ArkCloud EU down?" | ROUTE — `knownOutageRule`, incident macro |
| `consumer-us` | "Can I get a refund?" | ANSWER — eligible (purchased 7 days ago) |

---

## Project Structure

```
├── packages/shared/types.ts # Shared types (DecisionTrace, Customer, etc.)
├── packages/api/src/
│   ├── server.ts            # Fastify app, port 3001
│   ├── data/
│   │   ├── kb/              # KB docs as .md files with frontmatter
│   │   ├── customers.ts     # Mock customer records
│   │   └── tickets.ts       # In-memory ticket store
│   ├── services/
│   │   ├── ollama.ts        # embed() and chat() — Ollama API wrappers
│   │   ├── knowledge.ts     # Hybrid chunking, embedding, cosine search, chunk store
│   │   └── orchestration.ts # runOrchestration() — full request flow
│   ├── rules/
│   │   ├── engine.ts        # YAML-driven rules engine — runRulesEngine()
│   │   └── rules.yaml       # 6 rules, keywords, thresholds
│   ├── integrations/
│   │   ├── salesforce.ts    # Mock CRM (swap for real API here)
│   │   └── zendesk.ts       # Mock ticketing (swap for real API here)
│   ├── routes/              # /chat, /customers, /sessions, /knowledge/search
│   └── store/sessions.ts    # In-memory session + trace store
└── packages/ui/src/
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
