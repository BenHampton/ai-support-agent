# Ark Systems Support AI — Project Context

## What This Is

Production-grade prototype for a Senior Forward Deployed Engineer interview. This is not a demo or proof-of-concept — it is built to production standards: typed contracts across all boundaries, deterministic rules before any LLM call, full observability on every request, and mock integrations that swap to real ones without touching business logic.

The system simulates a production AI customer support agent for **Ark Systems** — a fictional B2B + B2C enterprise hardware and cloud company (Dell analog). It demonstrates the full Maven support pipeline end-to-end: RAG-based knowledge retrieval, a business rules engine, CRM/ticketing integrations (mock Salesforce + Zendesk), a streaming chat UI, and an FDE debug dashboard.

Every architectural decision should reflect what would be required in a real enterprise deployment, not what is convenient for a prototype.

## Tech Stack (LOCKED)

> The stack below is final. Do not suggest, introduce, or install any package or tool not listed here without explicit approval. If a genuine gap exists that cannot be addressed by the current stack, flag it for discussion before proceeding.

- **Frontend:** React + TypeScript (Vite), port 5173
- **Backend:** Node.js v26 + Fastify + TypeScript, port 3000
- **LLM (chat):** Ollama — `qwen3:8b`
- **Embeddings:** Ollama — `nomic-embed-text`
- **Vector search:** In-memory cosine similarity
- **Mock data:** Hardcoded TypeScript (no real Salesforce/Zendesk)
- **Testing:** Vitest (shared config, used in both frontend and backend)
- **Linting:** ESLint + Prettier (enforces conventions — no semicolons, single quotes, named exports)
- **TypeScript:** strict mode on (`"strict": true`) in all tsconfigs
- **Module system:** ESM throughout — `"type": "module"` in every `package.json`, `"module": "NodeNext"` + `"moduleResolution": "NodeNext"` in backend tsconfig, `"module": "ESNext"` + `"moduleResolution": "Bundler"` in frontend tsconfig

## Project Structure

npm workspaces monorepo. The three packages live under `packages/`. Shared types live in `packages/shared` and are imported via path alias `@shared/*` in both apps — no separate package, no build step.

Directory-specific guidance lives in `packages/api/CLAUDE.md` and `packages/ui/CLAUDE.md`, auto-loaded when working in those dirs.

- **Backend:** `tsconfig.json` paths: `"@shared/*": ["../shared/*"]`
- **Frontend:** `vite.config.ts` alias: `'@shared' → path.resolve(__dirname, '../shared')`

```
ai-support-agent/
├── package.json               # npm workspaces: ["packages/ui", "packages/api"]
├── data/                      # external mock data (read at runtime — swap point for real integrations)
│   ├── customers.json         # mock Salesforce customers
│   ├── tickets.json           # ticket-store seed ([] by default)
│   └── kb/                    # knowledge-base .md docs
└── packages/
    ├── shared/
    │   └── types.ts           # DecisionTrace, Customer, RuleResult, KnowledgeArticle, ZendeskTicket
    ├── ui/
    │   └── src/
    │       ├── components/
    │       │   ├── Chat/      # Customer-facing chat UI
    │       │   └── Dashboard/ # FDE log viewer
    │       └── App.tsx
    └── api/
        └── src/
            ├── routes/
            │   ├── chat.ts        # POST /chat
            │   ├── sessions.ts    # GET /sessions, GET /sessions/:id/trace
            │   └── knowledge.ts   # GET /knowledge/search
            ├── services/
            │   ├── ollama.ts      # embed() and chat() wrappers
            │   ├── knowledge.ts   # cosine similarity search
            │   ├── salesforce.ts  # mock CRM lookup
            │   ├── zendesk.ts     # mock ticket store
            │   └── rules.ts       # business rules engine
            └── server.ts
```

## Running the Project

```bash
# Prerequisites (pull once)
ollama pull qwen3:8b
ollama pull nomic-embed-text

# Start everything
npm run dev          # from root — starts frontend + backend concurrently

# Individual
cd api && npm run dev    # port 3001
cd ui && npm run dev     # port 5173
```

## Ark Systems Company Profile

**Ark Systems** is a global B2B + B2C technology company selling hardware, infrastructure, and cloud services. All mock data, knowledge articles, support scenarios, and business rules must be consistent with this profile.

### Product Lines
- **Ark Systems Laptops & Desktops** — consumer notebooks (Ark Series), business laptops (ArkBook Pro line), workstations, all-in-ones
- **Ark Systems Servers & Storage** — rack servers (ARK-R Series), NAS appliances, enterprise storage arrays — sold exclusively B2B
- **ArkCloud** — SaaS/IaaS platform: compute, managed storage, and hosted services; monthly and annual subscription billing
- **Ark Peripherals** — monitors, docks, keyboards, cables, webcams — high volume, low complexity support

### Customer Tiers
- **Consumer** — individual buyers; standard 1-year warranty; 30-day return (US), 14-day statutory return (EU)
- **SMB** — up to 50 seats; basic SLA; email + chat support; next-business-day response
- **Enterprise** — contract customers; named CSM; 4-hour response SLA; on-site support option; 3-year warranty on hardware
- **VIP** — dedicated support pod; 1-hour response SLA; billing disputes must always escalate to a human agent; white-glove onboarding

### Regions & Compliance
- **US** — standard 30-day return policy; no additional regulatory requirements
- **EU** — 14-day statutory right of return (overrides product policy); GDPR applies to all data handling; compliance language required on privacy topics

### Support Context
- Warranty claims require proof of purchase and serial number
- Refund eligibility: within return window + product unopened or defective + purchased direct from Ark Systems (not third-party)
- ArkCloud billing disputes always reference the subscription invoice ID
- Known recurring incident: ArkCloud EU region latency degradation (mock active outage used in routing rule)
- Escalation path for billing: Consumer/SMB → self-serve portal; Enterprise → CSM; VIP → immediate human handoff

## Conventions

### TypeScript
- **No `any`** — use `unknown` and narrow, or define a proper type
- **Explicit return types** on all service and route handler functions
- **`type` over `interface`** for shared data shapes; `interface` only when extension is intentional
- **Named exports only** — no default exports (easier to grep, refactor, and re-export)
- **No semicolons, single quotes, arrow functions** — consistent with global style
- **ES module syntax** (`import`/`export`), never `require`

### Naming
- **Files:** kebab-case (`ollama-service.ts`, `decision-trace.ts`)
- **Types/Classes:** PascalCase (`DecisionTrace`, `RuleResult`)
- **Functions/variables:** camelCase (`evaluateRules`, `knowledgeScore`)
- **Constants:** SCREAMING_SNAKE_CASE (`MAX_KNOWLEDGE_RESULTS`, `CONFIDENCE_THRESHOLD`)

### Imports
- **Path aliases only** — `@shared/types`, never `../../shared/types`
- **Group order:** external packages → `@shared/*` → internal (`./`, `../`)

## Key Types (`shared/types.ts`)

```typescript
DecisionTrace {
  sessionId, messageId, timestamp,
  customerContext: { tier, region, accountStatus, ... },
  knowledgeMatches: [{ articleId, score, snippet }],
  rulesEvaluated: [{ rule, fired, reason }],
  decision: 'answer' | 'escalate' | 'route',
  zendeskTicketId?: string,
  llmPrompt?: string,
  latencyMs: number
}

RuleResult { action: 'answer' | 'escalate' | 'route', reason: string, metadata: Record<string, unknown> }
Customer { customerId, name, tier, accountStatus, region, products[], purchaseDate, entitlements }
KnowledgeArticle { id, title, content, category, tags[] }
ZendeskTicket { id, customerId, sessionId, priority, reason, conversationContext, createdAt }
```

## Build Phases

See `phased-plan.md` for full checklists. Summary:

- **Phase 1** — Scaffold + mock data ← start here
- **Phase 2** — Ollama integration + RAG (knowledge search)
- **Phase 3** — Rules engine + mock Salesforce/Zendesk
- **Phase 4** — Chat orchestration API (`POST /chat`, session store)
- **Phase 5** — Chat UI (streaming, customer selector, trace panel)
- **Phase 6** — Dashboard (session list, trace timeline)
