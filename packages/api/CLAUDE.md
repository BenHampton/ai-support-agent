# API — Ark Systems Support AI

Backend-specific guidance. Auto-loaded when working under `packages/api/`. See the root `CLAUDE.md` for shared project context, tech stack, company profile, and shared conventions.

## Conventions

### API
- **Consistent response shape** — `{ data, error }` on all routes; never return raw objects
- **HTTP status codes matter** — 200 answer, 202 escalated, 422 invalid input, 500 pipeline failure
- **All errors typed** — define an `AppError` type, never throw raw strings

## Architecture Principles

- **Modular by layer** — each service (`ollama`, `knowledge`, `rules`, `salesforce`, `zendesk`) is independently importable and callable without standing up the full server. The escalation-durability subsystem is the one cohesive cross-layer module: `broker/` (publisher/queue/consumer)
- **Broker for durability** — escalations are modelled as a message broker under `broker/`, three files for three concepts: `queue.ts` is the passive storage for both the main queue and the DLQ (physically separate files); `publisher.ts` produces onto the queue — `publish()` new escalations and `replay()` dead-letters back (operator-triggered via `POST /admin/zendesk/dead-letters/replay`, never auto-drained); `consumer.ts` is the sole deliverer — drains the queue into Zendesk async and moves exhausted records to the DLQ. Dependencies point downward: publisher + consumer → `queue.ts`; consumer → `integrations/zendesk` + `store/sessions`; `queue.ts` stays a passive leaf
- **Rules before LLM** — deterministic rules always evaluate first; the LLM is only reached on an `ANSWER` decision
- **Trace everything** — every orchestration step emits to `DecisionTrace`, regardless of decision outcome; no silent paths
- **Mock at the boundary** — `integrations/salesforce.ts` and `integrations/zendesk.ts` are the integration swap points; the file-based `broker/queue.ts` is the durability swap point (a DB table or managed queue in production). All business logic above them is production-ready
- **Shared mutable state is deliberate and bounded** — the session store is append-only; rules and knowledge are read-only after startup. The only intentionally mutable module state is the durable escalation queue + DLQ (`broker/queue.ts`) and the outage feature flag (`store/feature-flags.ts`, a runtime toggle)

## Orchestration (per chat message)

```
POST /chat { sessionId, customerId, message }
  → [1] getCustomer(customerId)         — mock Salesforce
  → [2] embed(message) → cosineSearch() — top-5 knowledge articles + scores
  → [3] evaluateRules(ctx)              — deterministic rules before LLM
       ESCALATE → publish(queue) → return PENDING-<id> (consumer delivers to Zendesk async)
       ROUTE    → incident macro response
       ANSWER   → buildPrompt() → qwen3 stream
  → [4] log DecisionTrace to session store
  → [5] return { reply, trace }
```

A background consumer (`broker/consumer.ts`, started in `server.ts` via `startConsumer()`) is the sole
deliverer: it drains `ready` escalations into Zendesk asynchronously (on the next tick when healthy, or
once Zendesk recovers after an outage), then backfills the real ticket ID onto the stored trace.

## Business Rules (rules.ts)

Evaluated in order, first match wins:

- **`vipBillingRule`** — tier === 'VIP' + billing topic → ESCALATE
- **`lowConfidenceRule`** — max score < 0.4 → ESCALATE
- **`regulatedTopicRule`** — GDPR/legal/compliance keywords → ANSWER with approved language
- **`knownOutageRule`** — outage keywords → ROUTE to incident macro
- **`refundEligibilityRule`** — purchase date + region + product → ANSWER with eligibility
- **`selfServeBillingRule`** — non-VIP + billing → ANSWER self-serve

## Test Scenarios

Each maps to a specific customer ID, article, and rule. All must pass before marking a phase done.

- **`consumer-us`** — "How do I return my laptop?" → ANSWER — `return-policy-us`, `refundEligibilityRule`
- **`vip-eu`** — "I have a billing dispute on my invoice" → ESCALATE — Zendesk ticket, `vipBillingRule`
- **`smb-us`** — "What is quantum entanglement?" → ESCALATE — low confidence, `lowConfidenceRule`
- **`enterprise-eu`** — "What is your GDPR data retention policy?" → ANSWER — `gdpr-data-privacy-eu`, `regulatedTopicRule`
- **`consumer-us`** — "Is ArkCloud EU down?" → ROUTE — `arkcloud-eu-outage`, `knownOutageRule`
- **`consumer-us`** (purchased 7 days ago) — "Can I get a refund?" → ANSWER — eligible, `return-policy-us`, `refundEligibilityRule`
