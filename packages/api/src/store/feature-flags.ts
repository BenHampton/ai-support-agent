import { ZENDESK_DOWN_INITIAL } from '../config.ts'

// Runtime-mutable outage simulation. config exports are `const` (read once at startup), so the live
// state that the demo toggle (POST /admin/zendesk/down) and tests flip has to live here, not in config.
// The flag is read INSIDE the Zendesk client so a simulated outage is indistinguishable from a real one
// and exercises the full timeout → retry → breaker → queue → consumer path.

// how the simulated backend fails, so each resilience branch can be demoed/tested independently:
//   'timeout' → fast-fail with a retryable timeout error
//   '503'     → fast-fail with a retryable "service unavailable" error
//   'hang'    → never responds, so the per-call timeout is what fires
export type ZendeskFailureMode = 'timeout' | '503' | 'hang'

let zendeskDown = ZENDESK_DOWN_INITIAL
let failureMode: ZendeskFailureMode = 'timeout'

export const isZendeskDown = (): boolean => zendeskDown

export const getZendeskFailureMode = (): ZendeskFailureMode => failureMode

export const setZendeskDown = (down: boolean, mode?: ZendeskFailureMode): void => {
  zendeskDown = down
  if (mode) failureMode = mode
}
