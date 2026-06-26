// Shared copy for the Realtime throughput tables. Consumed both by the
// interactive component and by the markdown alternative in
// `internals/markdown-schema/RealtimeLimitsEstimator.ts`, so the headings and
// compute labels stay in sync. Keep this file free of React/browser imports.

export const COMPUTE_OPTIONS = [
  { value: 'micro', label: 'Micro' },
  { value: 'small', label: 'Small to medium' },
  { value: 'large', label: 'Large to 16XL' },
] as const

export const COMPUTE_LABELS: Record<string, string> = Object.fromEntries(
  COMPUTE_OPTIONS.map((o) => [o.value, o.label])
)

// Input-parameter columns (only shown in the full/raw table).
export const THROUGHPUT_PARAM_HEADINGS = ['Filters', 'RLS', 'Connected clients'] as const

// Result columns (shown in both the current-selection table and the raw table).
export const THROUGHPUT_METRIC_HEADINGS = [
  'Total DB changes /sec',
  'Max messages per client /sec',
  'Max total messages /sec',
  'Latency p95',
] as const

export const THROUGHPUT_TABLE_HEADINGS = [
  ...THROUGHPUT_PARAM_HEADINGS,
  ...THROUGHPUT_METRIC_HEADINGS,
] as const
