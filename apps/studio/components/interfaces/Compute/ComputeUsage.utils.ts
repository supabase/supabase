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

/* ------------------------------------------------------------------ *
 * Formatting                                                          *
 * ------------------------------------------------------------------ */

/**
 * Compute reads in vCPU-hours everywhere, including below an hour, so the precision has to
 * carry small values rather than rounding them to nothing: 0.04 is a real figure against an
 * 8.33 allowance, and "0.0" is not.
 */
export const formatDecimal = (value: number) => {
  const maximumFractionDigits = value < 1 ? 2 : value < 10 ? 1 : 0
  return value.toLocaleString(undefined, { maximumFractionDigits })
}

export const formatComputeHours = (hours: number): string => `${formatDecimal(hours)} hrs`

/**
 * Both sides of a quota comparison have to read in one unit — scaling each number on its own
 * size is how "1,067 vCPU-hrs of 500 vCPU-min" happens, which compares nothing. The unit is
 * written once, after the pair.
 */
export const formatVcpuQuota = (usedVcpuHours: number, includedVcpuHours: number | null) => {
  if (includedVcpuHours === null) return `${formatDecimal(usedVcpuHours)} vCPU-hrs`
  return `${formatDecimal(usedVcpuHours)}/${formatDecimal(includedVcpuHours)} vCPU-hrs`
}

/** Counts carry no unit, so the pair is all there is to say. */
export const formatCapacityQuota = (used: number, limit: number | null) =>
  limit === null ? used.toLocaleString() : `${used.toLocaleString()}/${limit.toLocaleString()}`

export const formatVcpuHours = (hours: number): string => `${formatDecimal(hours)} vCPU-hrs`

export const formatGbHours = (hours: number): string => `${formatDecimal(hours)} GB-hrs`

export const formatPercentage = (ratio: number): string => `${Math.round(ratio * 100)}%`

export const formatComputeRequests = (requests: number): string => {
  if (requests >= 1_000_000) return `${(requests / 1_000_000).toFixed(1)}M`
  if (requests >= 1_000) return `${(requests / 1_000).toFixed(1)}K`
  return requests.toLocaleString()
}

/* ------------------------------------------------------------------ *
 * Capacity headroom                                                   *
 * ------------------------------------------------------------------ */

/**
 * A capacity limit is never "80% used" in any way a developer can act on — what they want to
 * know is whether the next deploy fits. At 50 instances a ratio warning fires with ten slots
 * still free; at 2 it fires with none. So capacity warns on absolute headroom instead, and
 * the number of slots left is the whole message.
 */
export const COMPUTE_CAPACITY_WARNING_SLOTS = 2

export type ComputeCapacityStatus = 'available' | 'low' | 'full' | 'exceeded' | 'unlimited'

export interface ComputeCapacity {
  status: ComputeCapacityStatus
  used: number
  /** `null` when the plan sets no fixed cap. */
  limit: number | null
  /** Slots still free. Negative when more are running than the plan allows. */
  remaining: number | null
  /** Headroom phrased for a meter or a CLI footer. `null` when there is no cap. */
  label: string | null
}

export const getComputeCapacity = (used: number, limit: number | null): ComputeCapacity => {
  if (limit === null) {
    return { status: 'unlimited', used, limit: null, remaining: null, label: null }
  }

  const remaining = limit - used

  if (remaining < 0) {
    return {
      status: 'exceeded',
      used,
      limit,
      remaining,
      label: `${-remaining} over the limit`,
    }
  }

  if (remaining === 0) {
    return { status: 'full', used, limit, remaining, label: 'No room for more' }
  }

  // Headroom is only worth saying when it is nearly gone. "Room for 48 more" is noise next to
  // a counter that already reads 2/50.
  const isLow = remaining <= COMPUTE_CAPACITY_WARNING_SLOTS

  return {
    status: isLow ? 'low' : 'available',
    used,
    limit,
    remaining,
    label: isLow ? `Room for ${remaining} more` : null,
  }
}
