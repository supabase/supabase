/**
 * In-memory store for first-touch attribution data (referrer, UTMs, page URL).
 *
 * Captured before consent so no device storage is needed. Data is read once
 * by PageTelemetry after consent, then cleared. Lost on hard reload — accepted
 * trade-off (GROWTH-656).
 */

import type { getSharedTelemetryData } from './telemetry-utils'

export type SharedTelemetryData = ReturnType<typeof getSharedTelemetryData>

let firstTouchData: SharedTelemetryData | null = null

/** Write-once — subsequent calls are no-ops. */
export function setFirstTouchData(data: SharedTelemetryData): void {
  if (firstTouchData !== null) return
  firstTouchData = data
}

export function getFirstTouchData(): SharedTelemetryData | null {
  return firstTouchData
}

export function clearFirstTouchData(): void {
  firstTouchData = null
}
