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
       ESCALATE → publish to queue → PENDING- reference; consumer delivers to Zendesk async
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

### Escalation durability

An escalation is a write the customer was promised — it must survive a Zendesk outage or a
crash mid-call. It's modelled as a message broker (`broker/`) with RabbitMQ-style roles — a **publisher**
produces a record, a durable **queue** holds it, and a **consumer** drains it. A record is enqueued
`ready`, becomes `acked` once Zendesk accepts it, and is `dead-letter`ed after bounded delivery attempts.
The full path is:

```
timeout → retry → circuit breaker → queue → consumer → dead-letter
```

- **Publisher** (`broker/publisher.ts`) — on an ESCALATE decision `publish()` writes the intent to the
  queue keyed by the request's `messageId`, and the request returns immediately with a provisional
  `PENDING-<key>` reference. Zendesk is never called in the request path — delivery is fully async.
- **Durable queue** (`broker/queue.ts`) — the passive queue itself (`enqueue`/`ack`/`nack`/`deadLetter`/
  `listReady`), statuses `ready | acked | dead-letter`. Writes are atomic (`.tmp` + `rename`) and mirrored
  in memory, seeded from disk at startup, so queued escalations survive a restart.
- **Consumer** (`broker/consumer.ts`) — a background interval (`startConsumer`, single-flight guarded) is
  the sole deliverer: it drains each `ready` record, creates the Zendesk ticket with the record's stored
  key, `ack`s it and backfills the real `ZD-` id onto the stored session trace, or `deadLetter`s it after
  bounded attempts. A healthy escalation is delivered on the next tick; during an outage the record just
  stays `ready` until Zendesk recovers — an outage is a longer wait, not a separate code path.
- **Resilient client** (`integrations/zendesk.ts`) — the Zendesk write is wrapped in a per-call timeout,
  bounded retry with exponential backoff + jitter, and a circuit breaker that trips open after N
  consecutive failures so a sustained outage fails fast instead of paying the full retry budget.
  Idempotency keys make a retry (or consumer re-submit) return the same ticket, never a duplicate.

### Outage simulation / operator surface

The outage is injected at the Zendesk client boundary so the simulated fault is indistinguishable from
a real one and exercises the entire path above. A runtime feature flag (`store/feature-flags.ts`) drives
it, controlled from the **Admin** view (`packages/ui/src/components/Admin/`) or directly via:

- `POST /admin/zendesk/down` — body `{ down: boolean, mode?: 'timeout' | '503' | 'hang' }`; flips the
  simulated outage. `mode` selects how it fails (fast-fail timeout, 503, or hang until the client
  timeout fires).
- `GET /admin/zendesk/status` — returns `{ down, mode, queueDepth }`, where `queueDepth` is the number
  of escalations currently queued (`ready`) for reconciliation.

---

## Test Scenarios

| Customer | Message | Expected |
|---|---|---|
| `consumer-us` | "How do I return my laptop?" | ANSWER — `refundEligibilityRule` |
| `vip-eu` | "I have a billing dispute on my invoice" | ESCALATE — `vipBillingRule`, queued → Zendesk ticket (async) |
| `smb-us` | "What is quantum entanglement?" | ESCALATE — `lowConfidenceRule` (score < 0.5) |
| `enterprise-eu` | "What is your GDPR data retention policy?" | ANSWER — `regulatedTopicRule` |
| `consumer-us` | "Is ArkCloud EU down?" | ROUTE — `knownOutageRule`, incident macro |
| `consumer-us` | "Can I get a refund?" | ANSWER — eligible (purchased 7 days ago) |

---

## Project Structure

```
├── data/                        # external mock data (read at runtime — swap point for real integrations)
│   ├── customers.json           # mock Salesforce customer records
│   ├── tickets.json             # seed for the in-memory ticket store ([] by default)
│   ├── escalation-queue.json    # durable escalation queue (write-ahead, survives restart)
│   └── kb/                      # 10 knowledge-base docs as .md files with frontmatter
├── packages/shared/types.ts     # Shared types (DecisionTrace, Customer, etc.)
├── packages/api/src/
│   ├── server.ts                # Fastify app, port 3001; starts the background consumer (startConsumer())
│   ├── config.ts                # DATA_DIR — locates the root data/ dir
│   ├── services/
│   │   ├── ollama.ts            # embed() and chat() — Ollama API wrappers
│   │   ├── knowledge.ts         # Hybrid chunking, embedding, cosine search, chunk store
│   │   └── orchestration.ts     # runOrchestration() — full request flow
│   ├── broker/                  # escalation durability as a message broker (publisher/queue/consumer)
│   │   ├── queue.ts             # Durable queue — enqueue/ack/nack/deadLetter/listReady (atomic writes)
│   │   ├── publisher.ts         # publish() — produces a durable escalation record before the Zendesk call
│   │   └── consumer.ts          # startConsumer() — drains the queue into Zendesk once it recovers
│   ├── rules/
│   │   ├── engine.ts            # YAML-driven rules engine — runRulesEngine()
│   │   └── rules.yaml           # 6 rules, keywords, thresholds
│   ├── integrations/
│   │   ├── salesforce.ts        # Mock CRM — loads customers.json (swap for real API here)
│   │   └── zendesk.ts           # Mock ticketing + resilience layer (timeout/retry/breaker/idempotency)
│   ├── routes/                  # /chat, /customers, /sessions, /knowledge/search, /tickets, /admin
│   └── store/
│       ├── sessions.ts          # In-memory session + trace store
│       └── feature-flags.ts     # Runtime outage-simulation flag read inside the Zendesk client
└── packages/ui/src/
    ├── components/Chat/         # CustomerSelector, ChatWindow, TracePanel, EscalationCard
    ├── components/Admin/        # Zendesk outage toggle + queue depth (operator surface)
    └── components/Dashboard/    # SessionList, TraceTimeline
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

---

## Deferred scope

See [`v2.md`](./v2.md) for work intentionally left out of v1 and why — the robust fixes, known
tradeoffs, and roadmap behind the "smallest correct fix now" calls (e.g. keyword-routing precision vs.
grounding-aware routing). It doubles as the tradeoffs/roadmap source for the project write-up.
