import type { LogWindow } from '../contract'

/** A short label for the time window a logs query runs against. */
export function logWindowLabel(window?: LogWindow) {
  if (!window) return 'Last 24 hours'
  const minutes =
    (Date.parse(window.iso_timestamp_end) - Date.parse(window.iso_timestamp_start)) / 60_000
  if (minutes < 60) return `${Number(minutes.toFixed(1))} min window`
  return `${Number((minutes / 60).toFixed(1))}h window`
}
