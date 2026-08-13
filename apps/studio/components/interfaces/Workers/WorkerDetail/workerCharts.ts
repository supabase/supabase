import type { ChartConfig } from 'ui'

import type { Worker } from '../Workers.types'

/**
 * Deterministic mock time-series for the worker Overview tab.
 *
 * Mirrors the design-system "parent with mixed child widths" example, adapted
 * for workers. Timestamps are derived from a fixed base (not `new Date()`) so
 * the server and client renders match and React doesn't warn on hydration.
 */

export const CHART_INTERVALS = [
  { key: '15min', label: '15 min', format: 'MMM D, h:mm:ssa', minutes: 15 },
  { key: '1hr', label: '1 hour', format: 'MMM D, h:mma', minutes: 60 },
  { key: '3hr', label: '3 hours', format: 'MMM D, h:mma', minutes: 180 },
  { key: '1day', label: '1 day', format: 'MMM D, h:mma', minutes: 24 * 60 },
] as const

export type ChartIntervalKey = (typeof CHART_INTERVALS)[number]['key']

// Fixed base so SSR and client renders produce identical timestamps.
const CHART_END_ISO = '2026-08-10T09:00:00.000Z'

export interface WorkerInvocationDatum {
  timestamp: string
  ok_count: number
  warning_count: number
  error_count: number
}

export interface WorkerMetricsDatum extends WorkerInvocationDatum {
  avg_response_time: number
  max_response_time: number
  avg_cpu_time_used: number
  max_cpu_time_used: number
  avg_memory_used: number
  memory_percent: number
}

const hashString = (input: string): number => {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 0xffffffff
}

const pseudoNoise = (seed: number, amplitude = 1) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453
  return (value - Math.floor(value)) * amplitude
}

export const getIntervalMinutes = (intervalKey: string) =>
  CHART_INTERVALS.find((item) => item.key === intervalKey)?.minutes ?? 60

/** States where the worker is not serving traffic — charts render empty. */
export const isIdleState = (worker: Pick<Worker, 'state'>) =>
  worker.state === 'suspended' ||
  worker.state === 'killed' ||
  worker.state === 'deploying' ||
  worker.state === 'draining'

export interface WorkerChartData {
  invocation: WorkerInvocationDatum[]
  metrics: WorkerMetricsDatum[]
}

export const buildWorkerChartData = (
  worker: Pick<Worker, 'name' | 'state' | 'instances'>,
  intervalKey: string
): WorkerChartData => {
  if (isIdleState(worker)) return { invocation: [], metrics: [] }

  const isErrored = worker.state === 'errored'
  const seedBase = hashString(worker.name) * 1000
  const minutes = getIntervalMinutes(intervalKey)
  const end = new Date(CHART_END_ISO)
  end.setSeconds(0, 0)

  const invocation: WorkerInvocationDatum[] = Array.from({ length: minutes }, (_, index) => {
    const timestamp = new Date(end)
    timestamp.setMinutes(end.getMinutes() - (minutes - 1 - index))

    const progress = minutes <= 1 ? 0 : index / (minutes - 1)
    const baseLoad = (14 + Math.round(progress * 30)) * worker.instances
    const noise = Math.round(pseudoNoise(seedBase + index * 0.1, 10))

    const ok_count = Math.max(0, baseLoad + noise)
    const warning_count = index % 15 === 0 ? 2 + (index % 3) : index % 9 === 0 ? 1 : 0
    const error_count = isErrored
      ? index % 4 === 0
        ? 4 + (index % 5)
        : 1
      : index % 47 === 0
        ? 2
        : 0

    return { timestamp: timestamp.toISOString(), ok_count, warning_count, error_count }
  })

  const metrics: WorkerMetricsDatum[] = invocation.map((datum, index) => {
    const avg_response_time = Math.round(42 + pseudoNoise(seedBase + index + 2, 26) + index * 0.12)
    const max_response_time = Math.round(
      avg_response_time * (1.3 + pseudoNoise(seedBase + index + minutes, 0.4))
    )

    return {
      ...datum,
      avg_response_time,
      max_response_time,
      avg_cpu_time_used: Math.round(9 + pseudoNoise(seedBase + index + 4, 11) + index * 0.04),
      max_cpu_time_used: Math.round(18 + pseudoNoise(seedBase + index + 6, 20) + index * 0.08),
      avg_memory_used: Number(
        ((worker.state === 'errored' ? 55 : 42) + pseudoNoise(seedBase + index + 8, 14)).toFixed(1)
      ),
      memory_percent: Number((0.4 + pseudoNoise(seedBase + index + 9, 0.25)).toFixed(3)),
    }
  })

  return { invocation, metrics }
}

export const formatRate = (count: number, total: number) =>
  new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(
    total === 0 ? 0 : count / total
  )

export const formatMetric = (value: number, unit?: string) => {
  const formatted = unit === 'MB' ? value.toFixed(1) : Math.round(value).toLocaleString('en-US')
  return unit ? `${formatted}${unit}` : formatted
}

export const getSegmentedButtonClassName = (index: number, total: number) => {
  if (index === 0) return 'rounded-tr-none rounded-br-none'
  if (index === total - 1) return 'rounded-tl-none rounded-bl-none'
  return 'rounded-none'
}

export const sumBy = <T>(items: T[], getValue: (item: T) => number) =>
  items.reduce((total, item) => total + getValue(item), 0)

export const meanBy = <T>(items: T[], getValue: (item: T) => number) =>
  items.length === 0 ? 0 : sumBy(items, getValue) / items.length

export const RESPONSE_TIME_CHART_CONFIG = {
  avg_response_time: { label: 'Average Response Time', color: 'var(--foreground-default)' },
  max_response_time: { label: 'Max Response Time', color: 'hsl(var(--brand-default))' },
} satisfies ChartConfig

export const CPU_TIME_CHART_CONFIG = {
  max_cpu_time_used: { label: 'Max CPU Time', color: 'hsl(var(--brand-default))' },
} satisfies ChartConfig

export const MEMORY_CHART_CONFIG = {
  avg_memory_used: { label: 'Memory Usage', color: 'hsl(var(--brand-default))' },
} satisfies ChartConfig
