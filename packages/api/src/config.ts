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
