/**
 * In-memory store for first-touch attribution data.
 *
 * Replaces the previous `supabase-telemetry-data` session cookie so that
 * no non-essential device storage happens before affirmative consent in
 * GDPR regions (ePrivacy Directive compliance).
 *
 * The data is captured on the very first page load (before consent) and
 * held in a module-scoped variable. When consent is granted, PageTelemetry
 * reads it once for the initial pageview event and then clears it.
 *
 * Trade-off: data is lost on a hard reload (Cmd+R) before consent, which
 * is an accepted edge case (see GROWTH-656).
 *
 * Module-scope is safe here because both the writer (useFirstTouchStore)
 * and reader (PageTelemetry) live in the same client-side bundle — the
 * same pattern used by posthogClient and consentState.
 */

import type { getSharedTelemetryData } from './telemetry-utils'

export type SharedTelemetryData = ReturnType<typeof getSharedTelemetryData>

// ---------------------------------------------------------------------------
// Module-scoped singleton (survives SPA navigations, lost on hard reload)
// ---------------------------------------------------------------------------

let firstTouchData: SharedTelemetryData | null = null

/**
 * Store the first-touch attribution data captured on initial page load.
 * Only writes once — subsequent calls are no-ops if data already exists.
 */
export function setFirstTouchData(data: SharedTelemetryData): void {
  if (firstTouchData !== null) return
  firstTouchData = data
}

/**
 * Read the stored first-touch attribution data.
 * Returns null if no data has been captured (e.g. after a hard reload).
 */
export function getFirstTouchData(): SharedTelemetryData | null {
  return firstTouchData
}

/**
 * Clear the stored first-touch attribution data.
 * Called after the initial pageview event is sent, or when the user opts out.
 */
export function clearFirstTouchData(): void {
  firstTouchData = null
}
