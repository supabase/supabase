import { getComputeUnitWeight } from './ComputeUsage.constants'

export interface ComputeUsagePoint {
  /** ISO timestamp for the start of the bucket. */
  timestamp: string
  /** Instance-hours accrued in this bucket, before size weighting. */
  activeHours: number
  /** Size-weighted compute units accrued in this bucket. */
  computeUnits: number
  /** Mean number of instances live during the bucket. */
  instances: number
  requests: number
}

export interface ComputeUsageBySize {
  size: string
  activeHours: number
  computeUnits: number
}

export interface ComputeUsageByProject {
  projectRef: string
  projectName: string
  activeHours: number
  computeUnits: number
  instances: number
  requests: number
}

export const sumBy = <T>(items: T[], select: (item: T) => number): number =>
  items.reduce((total, item) => total + select(item), 0)

export const toComputeUnits = (activeHours: number, size: string): number =>
  activeHours * getComputeUnitWeight(size)

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

export const aggregateUsageBySize = (
  rows: { size: string; activeHours: number }[]
): ComputeUsageBySize[] => {
  const bySize = new Map<string, ComputeUsageBySize>()

  for (const row of rows) {
    const existing = bySize.get(row.size) ?? { size: row.size, activeHours: 0, computeUnits: 0 }
    existing.activeHours += row.activeHours
    existing.computeUnits += toComputeUnits(row.activeHours, row.size)
    bySize.set(row.size, existing)
  }

  return [...bySize.values()]
    .map((entry) => ({
      ...entry,
      activeHours: Number(entry.activeHours.toFixed(2)),
      computeUnits: Number(entry.computeUnits.toFixed(2)),
    }))
    .sort((a, b) => b.computeUnits - a.computeUnits)
}

/** Share of the total taken by the largest consumer, as a fraction. */
export const getUsageConcentration = (rows: { computeUnits: number }[]): number => {
  const total = sumBy(rows, (row) => row.computeUnits)
  if (total <= 0) return 0
  return Math.max(...rows.map((row) => row.computeUnits)) / total
}

/* ------------------------------------------------------------------ *
 * Formatting                                                          *
 * ------------------------------------------------------------------ */

export const formatComputeHours = (hours: number): string =>
  `${hours.toLocaleString(undefined, { maximumFractionDigits: hours < 10 ? 1 : 0 })} hrs`

export const formatComputeUnits = (units: number): string =>
  units.toLocaleString(undefined, { maximumFractionDigits: units < 10 ? 1 : 0 })

export const formatComputeRequests = (requests: number): string => {
  if (requests >= 1_000_000) return `${(requests / 1_000_000).toFixed(1)}M`
  if (requests >= 1_000) return `${(requests / 1_000).toFixed(1)}K`
  return requests.toLocaleString()
}
