import { mkdtempSync, cpSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { afterAll } from 'vitest'

// Per-test-file data isolation. Vitest runs test files in parallel, and the broker stores (queue / DLQ)
// persist to real files under data/. Sharing those across parallel files causes write races (a shared
// .tmp + rename collides) and cross-file state bleed. So each test file gets a fresh temp dir seeded with
// the repo's read-only fixtures (customers.json, tickets.json, kb/), and DATA_DIR points at it. This runs
// before config.ts is imported, so every store writes to the temp dir — never the tracked
// data/escalation-*.json files, which also stops tests from dirtying them.
const dir = mkdtempSync(join(tmpdir(), 'ark-data-'))
cpSync(join(process.cwd(), 'data'), dir, { recursive: true })
// start every test file with an empty queue + DLQ — never inherit whatever records happen to be sitting
// in the tracked runtime files (load() returns [] when they're absent)
rmSync(join(dir, 'escalation-queue.json'), { force: true })
rmSync(join(dir, 'escalation-dlq.json'), { force: true })
process.env.DATA_DIR = dir

afterAll(() => rmSync(dir, { recursive: true, force: true }))
