import { parseComputeSize } from './Compute.utils'

/**
 * runningHours      — hours instances are alive, busy or idle, but not suspended
 * reservedVcpuHours — runningHours x the vCPU the size reserves
 * usedVcpuHours     — CPU time actually consumed, the basis for active-CPU billing
 * gbHours           — runningHours x the memory the size reserves
 */
export interface ComputeUsagePoint {
  timestamp: string
  runningHours: number
  reservedVcpuHours: number
  usedVcpuHours: number
  gbHours: number
  /** Mean number of instances live during the bucket. */
  instances: number
  requests: number
}

export interface ComputeUsageBySize {
  size: string
  runningHours: number
  reservedVcpuHours: number
  gbHours: number
}

export interface ComputeUsageByProject {
  projectRef: string
  projectName: string
  deployments: number
  instances: number
  runningHours: number
  reservedVcpuHours: number
  usedVcpuHours: number
  gbHours: number
  requests: number
}

export const sumBy = <T>(items: T[], select: (item: T) => number): number =>
  items.reduce((total, item) => total + select(item), 0)

/** vCPU-hours reserved by an instance of this size over the given alive hours. */
export const toVcpuHours = (runningHours: number, size: string): number =>
  runningHours * (parseComputeSize(size)?.vcpu ?? 0)

/** GB-hours reserved by an instance of this size over the given alive hours. */
export const toGbHours = (runningHours: number, size: string): number =>
  runningHours * (parseComputeSize(size)?.memoryGb ?? 0)

/* ------------------------------------------------------------------ *
 * Burn-down                                                           *
 * ------------------------------------------------------------------ */

export type ComputeAllowanceStatus = 'healthy' | 'warning' | 'exhausted' | 'unlimited'

export interface ComputeBurndownPoint {
  timestamp: string
  used: number
}

export interface ComputeBurndown {
  points: ComputeBurndownPoint[]
  used: number
  /** `null` when there is no fixed allowance. */
  allowance: number | null
  remaining: number | null
  usedRatio: number | null
  warningAt: number | null
  status: ComputeAllowanceStatus
}

export const buildComputeBurndown = (
  points: ComputeUsagePoint[],
  select: (point: ComputeUsagePoint) => number,
  allowance: number | null,
  warningThreshold: number
): ComputeBurndown => {
  let running = 0
  const burndownPoints = points.map((point) => {
    running += select(point)
    return { timestamp: point.timestamp, used: Number(running.toFixed(2)) }
  })

  const used = Number(running.toFixed(2))

  if (allowance === null || allowance <= 0) {
    return {
      points: burndownPoints,
      used,
      allowance: null,
      remaining: null,
      usedRatio: null,
      warningAt: null,
      status: 'unlimited',
    }
  }

  const usedRatio = used / allowance
  const status: ComputeAllowanceStatus =
    usedRatio >= 1 ? 'exhausted' : usedRatio >= warningThreshold ? 'warning' : 'healthy'

  return {
    points: burndownPoints,
    used,
    allowance,
    remaining: Number(Math.max(0, allowance - used).toFixed(2)),
    usedRatio,
    warningAt: allowance * warningThreshold,
    status,
  }
}

export const getCpuUtilization = (usedVcpuHours: number, reservedVcpuHours: number) => {
  if (reservedVcpuHours <= 0) return null
  return Math.min(1, usedVcpuHours / reservedVcpuHours)
}

/* ------------------------------------------------------------------ *
 * Aggregation                                                         *
 * ------------------------------------------------------------------ */

export const aggregateUsageBySize = (
  rows: { size: string; runningHours: number }[]
): ComputeUsageBySize[] => {
  const bySize = new Map<string, ComputeUsageBySize>()

  for (const row of rows) {
    const existing = bySize.get(row.size) ?? {
      size: row.size,
      runningHours: 0,
      reservedVcpuHours: 0,
      gbHours: 0,
    }
    existing.runningHours += row.runningHours
    existing.reservedVcpuHours += toVcpuHours(row.runningHours, row.size)
    existing.gbHours += toGbHours(row.runningHours, row.size)
    bySize.set(row.size, existing)
  }

  return [...bySize.values()]
    .map((entry) => ({
      size: entry.size,
      runningHours: Number(entry.runningHours.toFixed(2)),
      reservedVcpuHours: Number(entry.reservedVcpuHours.toFixed(2)),
      gbHours: Number(entry.gbHours.toFixed(2)),
    }))
    .sort((a, b) => b.runningHours - a.runningHours)
}

/** Share of the total taken by the largest row, as a fraction. */
export const getUsageConcentration = (values: number[]): number => {
  const total = values.reduce((sum, value) => sum + value, 0)
  if (total <= 0) return 0
  return Math.max(...values) / total
}

/* ------------------------------------------------------------------ *
 * Formatting                                                          *
 * ------------------------------------------------------------------ */

const round = (value: number) =>
  value.toLocaleString(undefined, { maximumFractionDigits: value < 10 ? 1 : 0 })

export const formatComputeHours = (hours: number): string => `${round(hours)} hrs`

/**
 * The included quota is quoted in vCPU-minutes, so usage reads in minutes until it is large
 * enough that hours are easier to scan.
 */
export const formatVcpuMinutes = (vcpuHours: number): string => {
  const minutes = vcpuHours * 60
  return minutes < 10_000
    ? `${Math.round(minutes).toLocaleString()} vCPU-min`
    : formatVcpuHours(vcpuHours)
}

export const formatVcpuHours = (hours: number): string => `${round(hours)} vCPU-hrs`

export const formatGbHours = (hours: number): string => `${round(hours)} GB-hrs`

export const formatPercentage = (ratio: number): string => `${Math.round(ratio * 100)}%`

export const formatComputeRequests = (requests: number): string => {
  if (requests >= 1_000_000) return `${(requests / 1_000_000).toFixed(1)}M`
  if (requests >= 1_000) return `${(requests / 1_000).toFixed(1)}K`
  return requests.toLocaleString()
}
