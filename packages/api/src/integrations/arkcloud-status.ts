import type { Incident } from '@shared/types'
import { OUTAGE_ACTIVE } from '../config.ts'

// mock status page — the active flag is env-driven (OUTAGE_ACTIVE); swap this for a real
// status-page / incident-management API (Statuspage, PagerDuty, internal service)
const INCIDENT: Incident = {
  id: 'arkcloud-eu-outage',
  title: 'ArkCloud EU Region — Latency Degradation',
  regions: ['EU-WEST-1', 'EU-CENTRAL-1'],
  eta: '20:30 UTC today',
  workaround: 'If you have a multi-region setup, you can redirect traffic to EU-NORTH-1 or US-EAST-1 via ArkCloud Console → Settings → Region Preferences.',
  statusUrl: 'status.arksystems.com'
}

export const getActiveIncidents = async (): Promise<Incident[]> => {
  return OUTAGE_ACTIVE ? [INCIDENT] : []
}

// single source of truth for the customer-facing incident reply (the route macro)
export const formatIncidentMessage = (incident: Incident): string => {
  return `We are aware of an active incident affecting ArkCloud ${incident.regions.join(' and ')} regions. Our infrastructure team is working on a fix with an ETA of ${incident.eta}.

Workaround: ${incident.workaround}

All affected customers will receive automatic SLA credits. Monitor real-time status at ${incident.statusUrl}.

We apologize for the inconvenience.`
}
