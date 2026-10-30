import { parseComputeSize } from './Compute.utils'

/**
 * Usage is measured on instances, not on deployments. Four measures, all derived from
 * things the platform can actually count:
 *
 *   instanceHours — instances x hours alive
 *   activeHours   — hours spent serving rather than suspended
 *   vcpuHours     — activeHours x the vCPU the size reserves
 *   gbHours       — activeHours x the memory the size reserves
 */
export interface ComputeUsagePoint {
  /** ISO timestamp for the start of the bucket. */
  timestamp: string
  activeHours: number
  vcpuHours: number
  gbHours: number
  /** Mean number of instances live during the bucket. */
  instances: number
  requests: number
}

export interface ComputeUsageBySize {
  size: string
  activeHours: number
  vcpuHours: number
  gbHours: number
}

export interface ComputeUsageByProject {
  projectRef: string
  projectName: string
  /** Compute deployments in the project. Each runs one or more instances. */
  deployments: number
  instances: number
  activeHours: number
  vcpuHours: number
  gbHours: number
  requests: number
}

export const sumBy = <T>(items: T[], select: (item: T) => number): number =>
  items.reduce((total, item) => total + select(item), 0)

/** vCPU-hours reserved by an instance of this size over the given alive hours. */
export const toVcpuHours = (activeHours: number, size: string): number =>
  activeHours * (parseComputeSize(size)?.vcpu ?? 0)

/** GB-hours reserved by an instance of this size over the given alive hours. */
export const toGbHours = (activeHours: number, size: string): number =>
  activeHours * (parseComputeSize(size)?.memoryGb ?? 0)

/* ------------------------------------------------------------------ *
 * Burn-down                                                           *
 * ------------------------------------------------------------------ */

export type ComputeAllowanceStatus = 'healthy' | 'warning' | 'exhausted' | 'unlimited'

export interface ComputeBurndownPoint {
  timestamp: string
  /** Cumulative active hours used up to and including this bucket. */
  usedHours: number
}

export interface ComputeBurndown {
  points: ComputeBurndownPoint[]
  usedHours: number
  /** `null` when the plan carries no fixed allowance. */
  allowanceHours: number | null
  remainingHours: number | null
  /** Fraction of the allowance consumed. `null` when there is no allowance. */
  usedRatio: number | null
  warningHours: number | null
  status: ComputeAllowanceStatus
}

/**
 * Accumulates active hours across the cycle and measures them against the plan allowance.
 * Returns `unlimited` rather than faking a denominator when a plan has no fixed allowance.
 */
export const buildComputeBurndown = (
  points: ComputeUsagePoint[],
  allowanceHours: number | null,
  warningThreshold: number
): ComputeBurndown => {
  let running = 0
  const burndownPoints = points.map((point) => {
    running += point.activeHours
    return { timestamp: point.timestamp, usedHours: Number(running.toFixed(2)) }
  })

  const usedHours = Number(running.toFixed(2))

  if (allowanceHours === null || allowanceHours <= 0) {
    return {
      points: burndownPoints,
      usedHours,
      allowanceHours: null,
      remainingHours: null,
      usedRatio: null,
      warningHours: null,
      status: 'unlimited',
    }
  }

  const usedRatio = usedHours / allowanceHours
  const status: ComputeAllowanceStatus =
    usedRatio >= 1 ? 'exhausted' : usedRatio >= warningThreshold ? 'warning' : 'healthy'

  return {
    points: burndownPoints,
    usedHours,
    allowanceHours,
    remainingHours: Number(Math.max(0, allowanceHours - usedHours).toFixed(2)),
    usedRatio,
    warningHours: allowanceHours * warningThreshold,
    status,
  }
}

/* ------------------------------------------------------------------ *
 * Aggregation                                                         *
 * ------------------------------------------------------------------ */

/** Groups active hours by instance size, the way database compute reports its own hours. */
export const aggregateUsageBySize = (
  rows: { size: string; activeHours: number }[]
): ComputeUsageBySize[] => {
  const bySize = new Map<string, ComputeUsageBySize>()

  for (const row of rows) {
    const existing = bySize.get(row.size) ?? {
      size: row.size,
      activeHours: 0,
      vcpuHours: 0,
      gbHours: 0,
    }
    existing.activeHours += row.activeHours
    existing.vcpuHours += toVcpuHours(row.activeHours, row.size)
    existing.gbHours += toGbHours(row.activeHours, row.size)
    bySize.set(row.size, existing)
  }

  return [...bySize.values()]
    .map((entry) => ({
      size: entry.size,
      activeHours: Number(entry.activeHours.toFixed(2)),
      vcpuHours: Number(entry.vcpuHours.toFixed(2)),
      gbHours: Number(entry.gbHours.toFixed(2)),
    }))
    .sort((a, b) => b.activeHours - a.activeHours)
}

/** Share of total active hours taken by the largest consumer, as a fraction. */
export const getUsageConcentration = (rows: { activeHours: number }[]): number => {
  const total = sumBy(rows, (row) => row.activeHours)
  if (total <= 0) return 0
  return Math.max(...rows.map((row) => row.activeHours)) / total
}

/* ------------------------------------------------------------------ *
 * Formatting                                                          *
 * ------------------------------------------------------------------ */

const round = (value: number) =>
  value.toLocaleString(undefined, { maximumFractionDigits: value < 10 ? 1 : 0 })

export const formatComputeHours = (hours: number): string => `${round(hours)} hrs`

export const formatVcpuHours = (hours: number): string => `${round(hours)} vCPU-hrs`

export const formatGbHours = (hours: number): string => `${round(hours)} GB-hrs`

export const formatComputeRequests = (requests: number): string => {
  if (requests >= 1_000_000) return `${(requests / 1_000_000).toFixed(1)}M`
  if (requests >= 1_000) return `${(requests / 1_000).toFixed(1)}K`
  return requests.toLocaleString()
}
