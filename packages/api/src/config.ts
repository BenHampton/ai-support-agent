import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '../../..')

// External mock data lives at the repo root in /data (customers.json, tickets.json, kb/).
// In a real deployment this comes from Salesforce/Zendesk/a knowledge store instead.
// A DATA_DIR override is resolved against the repo root (not cwd), so values like ./data work
// regardless of which package dir the process starts in. Absolute paths are used as-is.
export const DATA_DIR = process.env.DATA_DIR
  ? resolve(REPO_ROOT, process.env.DATA_DIR)
  : join(REPO_ROOT, 'data')

// outage demo toggle — default on; set OUTAGE_ACTIVE=false to simulate "no active incident"
export const OUTAGE_ACTIVE = process.env.OUTAGE_ACTIVE !== 'false'

// reject absurdly long messages before they reach embedding/LLM — bounds cost and shrinks the
// prompt-injection surface. A general guard, not refund-specific.
export const MAX_MESSAGE_LENGTH = Number(process.env.MAX_MESSAGE_LENGTH ?? 4000)

// Zendesk resilience knobs — bound how long an escalation waits on a flaky ticketing backend and
// how hard we retry before falling back to the durable queue. See integrations/zendesk.ts.
export const ZENDESK_TIMEOUT_MS = Number(process.env.ZENDESK_TIMEOUT_MS ?? 4000)
export const ZENDESK_MAX_RETRIES = Number(process.env.ZENDESK_MAX_RETRIES ?? 2)
export const ZENDESK_BREAKER_THRESHOLD = Number(process.env.ZENDESK_BREAKER_THRESHOLD ?? 5)
export const ZENDESK_BREAKER_COOLDOWN_MS = Number(process.env.ZENDESK_BREAKER_COOLDOWN_MS ?? 30_000)
// background worker cadence for draining the escalation queue once Zendesk recovers
export const RECONCILER_INTERVAL_MS = Number(process.env.RECONCILER_INTERVAL_MS ?? 10_000)
// simulate a Zendesk outage from startup; flip live via POST /admin/zendesk/down
export const ZENDESK_DOWN_INITIAL = process.env.ZENDESK_DOWN === 'true'
