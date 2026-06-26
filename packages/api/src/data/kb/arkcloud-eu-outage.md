---
id: arkcloud-eu-outage
title: ArkCloud EU Region — Active Incident: Latency Degradation
category: incidents
tags: outage, incident, eu, arkcloud, latency, degradation, down, service, disruption
---

## Incident Status

**ACTIVE** — Last updated: 2026-06-23 18:00 UTC

Ark Systems is investigating elevated latency and intermittent request timeouts in the ArkCloud EU region.

## Affected Services

- ArkCloud Compute API
- Managed Storage read operations
- ArkCloud web dashboard

## Unaffected

- ArkCloud EU-NORTH-1 (operating normally)
- US regions
- APAC regions

## Root Cause

A networking configuration change deployed during the scheduled maintenance window at 14:00 UTC caused unexpected routing asymmetry between availability zones. Our infrastructure team has identified the affected components and is rolling back the change.

**Estimated time to full recovery:** 2026-06-23 20:30 UTC

## Workaround

Customers with multi-region ArkCloud configurations can temporarily redirect traffic:

1. Go to **ArkCloud Console > Settings > Region Preferences**
2. Update your endpoint to `EU-NORTH-1` or `US-EAST-1`

## SLA Credits

All impacted customers will receive an SLA credit for the affected period. Credits are applied automatically at month end.

For real-time updates, subscribe to **status.arksystems.com**.
