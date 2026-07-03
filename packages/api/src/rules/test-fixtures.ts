import type { Customer, Incident, KnowledgeBaseMatch, RuleEvaluation } from '@shared/types'

// minimal builders for deterministic engine tests — no Ollama, no data files

export const makeCustomer = (overrides: Partial<Customer> = {}): Customer => ({
  customerId: 'consumer-us',
  name: 'Test Customer',
  tier: 'consumer',
  region: 'us',
  accountStatus: 'active',
  products: ['Ark Series NX-14 Laptop'],
  purchaseDate: '2026-06-16',
  entitlements: ['1-year-warranty'],
  ...overrides
})

export const match = (kbId: string, score: number): KnowledgeBaseMatch => ({
  kbMatchId: `${kbId}#0`,
  kbId,
  score,
  snippet: `snippet from ${kbId}`
})

export const EU_OUTAGE: Incident = {
  id: 'arkcloud-eu-outage',
  title: 'ArkCloud EU Region — Latency Degradation',
  regions: ['EU-WEST-1', 'EU-CENTRAL-1'],
  eta: '20:30 UTC today',
  workaround: 'Redirect traffic to EU-NORTH-1 or US-EAST-1.',
  statusUrl: 'status.arksystems.com'
}

// the name of the rule that fired, or undefined when none matched
export const firedRule = (evaluations: RuleEvaluation[]): string | undefined =>
  evaluations.find((e) => e.fired)?.rule
