# Ark Systems Support AI — Phased Build Plan

**Company:** Ark Systems — B2B + B2C enterprise hardware, cloud subscriptions, and consumer peripherals (Dell analog). Regions: US and EU only.
**Stack:** React + Vite (frontend) · Fastify + TypeScript (backend) · Ollama (qwen3:8b chat, nomic-embed-text embeddings) · In-memory vector search

---

## Prerequisites

```bash
ollama pull qwen3:8b
ollama pull nomic-embed-text
```

---

## Phase 1 — Scaffold + Mock Data
**Goal:** Both apps run, shared types resolve, mock data is defined, health route responds.

- [ ] Root `package.json` — npm workspaces: `["ui", "api"]`, `dev` script runs both concurrently
- [ ] `packages/shared/types.ts` — all shared types (`DecisionTrace`, `Customer`, `RuleResult`, `KnowledgeArticle`, `ZendeskTicket`)
- [ ] Init `packages/api/` — Fastify + TypeScript, `tsconfig.json` with `paths: { "@shared/*": ["../shared/*"] }`
- [ ] Init `packages/ui/` — Vite + React + TypeScript, `vite.config.ts` with alias `@shared → ../shared`
- [ ] `packages/api/src/data/customers.ts` — 8 mock customers, 2 per tier (one US, one EU each):
  - `consumer-us` — Consumer, US, standard warranty, purchased 7 days ago (refund eligible)
  - `consumer-eu` — Consumer, EU, standard warranty, purchased 60 days ago (outside return window)
  - `smb-us` — SMB, US, 10 seats, ArkBook Pro fleet
  - `smb-eu` — SMB, EU, 5 seats, ArkCloud subscription
  - `enterprise-us` — Enterprise, US, contract, named CSM, ARK-R Series servers
  - `enterprise-eu` — Enterprise, EU, contract, GDPR data processor agreement in place
  - `vip-us` — VIP, US, dedicated support pod, active ArkCloud contract
  - `vip-eu` — VIP, EU, dedicated support pod, recent billing dispute history
- [ ] `packages/api/src/data/articles.ts` — 10 knowledge base articles, realistic 2-4 paragraph content:
  - `return-policy-us` — 30-day return window, direct purchase only, condition requirements, RMA process
  - `return-policy-eu` — 14-day statutory right of return, GDPR reference, how to initiate return online
  - `gdpr-data-privacy-eu` — approved compliance language, data retention periods, right to erasure process, DPO contact
  - `warranty-claim-process` — proof of purchase + serial number required, 1-year consumer / 3-year enterprise, depot vs on-site repair
  - `arkcloud-billing-faq` — invoice structure, subscription tiers, how to dispute a charge, proration policy
  - `arkcloud-eu-outage` — active incident: EU region latency degradation, affected services, ETA, workaround steps
  - `laptop-desktop-troubleshooting` — screen replacement, boot issues, factory reset, hardware diagnostics tool
  - `server-storage-support` — ARK-R Series common failures, RAID rebuilds, firmware updates, enterprise support portal
  - `enterprise-sla-tiers` — response SLAs by tier (SMB NBD, Enterprise 4hr, VIP 1hr), escalation contacts, CSM details
  - `billing-dispute-escalation` — self-serve portal for Consumer/SMB, CSM path for Enterprise, immediate handoff for VIP
- [ ] `packages/api/src/data/tickets.ts` — in-memory Zendesk ticket store (empty array)
- [ ] `GET /health` route → `{ status: 'ok' }`

**Done when:** `npm run dev` at root starts both servers, and importing `@shared/types` resolves correctly in both frontend and backend.

---

## Phase 2 — Ollama Integration + RAG
**Goal:** Knowledge search works end-to-end via the API.

- [ ] `packages/api/src/services/ollama.ts` — `embed(text)` and `chat(messages, onChunk)` functions
- [ ] On server startup: embed all 10 articles → store as `{ id, text, embedding[], metadata }[]` in memory
- [ ] `packages/api/src/services/knowledge.ts` — cosine similarity search, returns top-N matches with scores
- [ ] `GET /knowledge/search?q=<query>` route — returns top-3 articles with scores

**Done when:** Hitting `/knowledge/search?q=how do I return a laptop` returns relevant articles with similarity scores.

---

## Phase 3 — Rules Engine + Mock Integrations
**Goal:** All business rules evaluate correctly against mock customer data.

- [ ] `packages/api/src/services/salesforce.ts` — `getCustomer(customerId)` lookup
- [ ] `packages/api/src/services/zendesk.ts` — `createTicket(data)`, `getTickets()` against in-memory store
- [ ] `packages/api/src/services/rules.ts` — 6 typed rule functions:
  - `vipBillingRule` — VIP tier + billing topic → ESCALATE
  - `lowConfidenceRule` — max knowledge score < 0.4 → ESCALATE
  - `regulatedTopicRule` — GDPR/legal/compliance keywords → REQUIRE approved language
  - `knownOutageRule` — outage keywords → ROUTE to incident macro
  - `refundEligibilityRule` — purchase date + region + product type → ANSWER with eligibility
  - `selfServeBillingRule` — non-VIP + billing → ANSWER with self-serve instructions
- [ ] Each rule: `(ctx: RuleContext) => RuleResult | null`

**Done when:** Can call `evaluateRules({ customer, query, knowledgeScores })` and get the correct action for each of the 5 test scenarios.

---

## Phase 4 — Chat Orchestration API
**Goal:** Full pipeline runs on `POST /chat`, decision trace is logged.

- [ ] `DecisionTrace` and all related types defined in `packages/shared/types.ts` (not backend — shared across frontend and backend)
- [ ] `POST /chat` — orchestrates:
  1. Load customer from mock Salesforce
  2. Embed query → knowledge search → top-3 matches
  3. Evaluate rules → get action (answer / escalate / route)
  4. If escalate: create Zendesk ticket, return handoff message + trace
  5. If answer: build system prompt with customer context + knowledge chunks → stream qwen3 response
  6. Log full `DecisionTrace` to in-memory session store
- [ ] In-memory session store: `Map<sessionId, { messages: Message[], traces: DecisionTrace[] }>`
- [ ] `GET /sessions` — list of recent sessions
- [ ] `GET /sessions/:id/trace` — full trace for a session

**Done when:** `POST /chat` with a VIP customer + billing message returns an escalation with a Zendesk ticket ID in the trace.

---

## Phase 5 — Chat UI
**Goal:** Working customer-facing chat with live trace panel.

- [ ] Customer selector dropdown (left panel) — populated from `GET /customers`
- [ ] Chat window (main panel) — message list, input, streaming response via SSE or polling
- [ ] Escalation card component — shows when `decision === 'escalate'`, displays Zendesk ticket ID
- [ ] Live trace panel (right panel, collapsible) — shows last message's rules fired, knowledge used, confidence scores
- [ ] `GET /customers` route on backend (list of mock customers for dropdown)

**Done when:** Can select a VIP customer, type "I have a billing dispute", and see: escalation message + ticket card + trace panel showing `vipBillingRule` fired.

---

## Phase 6 — Dashboard (FDE Log Viewer)
**Goal:** FDE can inspect any session's full decision pipeline.

- [ ] Session list view — table: customerId, tier, message count, last decision, timestamp
- [ ] Trace detail view — expandable timeline per message:
  - Customer context loaded (tier, region, account status)
  - Knowledge matches (article title, score, snippet)
  - Rules evaluated (rule name, fired: true/false, reason)
  - Decision (answer / escalate / route)
  - Response preview
- [ ] Confidence score badge (color: green ≥ 0.7, yellow 0.4–0.7, red < 0.4)

**Done when:** Dashboard shows all sessions from chat testing, trace detail matches exactly what happened in the pipeline.

---

## Test Scenarios (run after Phase 4+)

- **consumer-us** — "How do I return my laptop?" → ANSWER — `return-policy-us` article
- **vip-eu** — "I have a billing dispute on my invoice" → ESCALATE — Zendesk ticket created, `vipBillingRule` fired
- **smb-us** — "What is quantum entanglement?" → ESCALATE — low confidence (score < 0.4), `lowConfidenceRule` fired
- **enterprise-eu** — "What is your GDPR data retention policy?" → ANSWER — `gdpr-data-privacy-eu` article, `regulatedTopicRule` fired
- **consumer-us** — "Is ArkCloud EU down?" → ROUTE — `arkcloud-eu-outage` macro, `knownOutageRule` fired
- **consumer-us** (purchased 7 days ago) — "Can I get a refund?" → ANSWER — eligible per `return-policy-us`, `refundEligibilityRule` fired

---

## Architecture Reference

```
User message
  → [1] GET customer (mock Salesforce)
  → [2] embed(query) → cosine search → top-3 articles + scores
  → [3] evaluateRules({ customer, query, scores }) → RuleResult
       ESCALATE → createTicket(zendesk) → handoff message
       ROUTE    → macro/incident response
       ANSWER   → buildPrompt(context + chunks) → qwen3 stream
  → [4] log DecisionTrace
  → [5] return { reply, trace }
```
