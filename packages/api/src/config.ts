import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// External mock data lives at the repo root in /data (customers.json, tickets.json, kb/).
// In a real deployment this comes from Salesforce/Zendesk/a knowledge store instead —
// override the location with the DATA_DIR env var.
export const DATA_DIR = process.env.DATA_DIR ?? join(__dirname, '../../../data')
