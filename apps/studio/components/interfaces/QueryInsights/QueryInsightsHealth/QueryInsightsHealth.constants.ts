import type { HealthLevel } from './QueryInsightsHealth.types'

export const SLOW_QUERY_THRESHOLD_MS = 200
export const HIGH_CALL_THRESHOLD = 100

export const SCORE_DEDUCTIONS = {
  error: 20,
  indexHighCalls: 15,
  indexLowCalls: 8,
  slowHighCalls: 10,
  slowLowCalls: 5,
} as const

export const HEALTH_LEVELS: Record<HealthLevel, { label: string; min: number }> = {
  healthy: { label: 'Healthy', min: 70 },
  warning: { label: 'Needs attention', min: 40 },
  critical: { label: 'Critical', min: 0 },
}

export const HEALTH_COLORS: Record<HealthLevel, string> = {
  healthy: 'hsl(var(--brand-default))',
  warning: 'hsl(var(--warning-default))',
  critical: 'hsl(var(--destructive-default))',
}
