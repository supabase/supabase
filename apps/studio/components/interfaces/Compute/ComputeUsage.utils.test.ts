import { describe, expect, it } from 'vitest'

import {
  COMPUTE_ALLOWANCE_WARNING_THRESHOLD,
  getComputeActiveHoursAllowance,
  getComputeUnitWeight,
} from './ComputeUsage.constants'
import {
  aggregateUsageBySize,
  buildComputeBurndown,
  formatComputeHours,
  formatComputeRequests,
  formatComputeUnits,
  getUsageConcentration,
  toComputeUnits,
  type ComputeUsagePoint,
} from './ComputeUsage.utils'

const point = (activeHours: number, timestamp = '2026-10-01T00:00:00.000Z'): ComputeUsagePoint => ({
  timestamp,
  activeHours,
  computeUnits: activeHours,
  instances: 1,
  requests: 0,
})

describe('compute unit weighting', () => {
  it('weights a 4gb instance at twice a 2gb one', () => {
    expect(getComputeUnitWeight('2gb-1vcpu')).toBe(1)
    expect(getComputeUnitWeight('4gb-2vcpu')).toBe(2)
    expect(toComputeUnits(10, '4gb-2vcpu')).toBe(20)
  })

  it('falls back to a weight of 1 for an unrecognised size', () => {
    expect(getComputeUnitWeight('16gb-8vcpu')).toBe(1)
    expect(toComputeUnits(10, 'something-new')).toBe(10)
  })
})

describe('plan allowances', () => {
  it('returns the configured allowance per plan', () => {
    expect(getComputeActiveHoursAllowance('free')).toBe(50)
    expect(getComputeActiveHoursAllowance('pro')).toBe(500)
    expect(getComputeActiveHoursAllowance('team')).toBe(2000)
  })

  it('returns null for enterprise, which has no fixed allowance', () => {
    expect(getComputeActiveHoursAllowance('enterprise')).toBeNull()
  })

  it('falls back to the free allowance for an unknown or missing plan', () => {
    expect(getComputeActiveHoursAllowance(undefined)).toBe(50)
    expect(getComputeActiveHoursAllowance('some-future-plan')).toBe(50)
  })
})

describe('buildComputeBurndown', () => {
  const threshold = COMPUTE_ALLOWANCE_WARNING_THRESHOLD

  it('accumulates active hours across buckets', () => {
    const burndown = buildComputeBurndown([point(10), point(5), point(2.5)], 100, threshold)
    expect(burndown.points.map((p) => p.usedHours)).toEqual([10, 15, 17.5])
    expect(burndown.usedHours).toBe(17.5)
    expect(burndown.remainingHours).toBe(82.5)
  })

  it('reports healthy below the warning threshold', () => {
    const burndown = buildComputeBurndown([point(50)], 100, threshold)
    expect(burndown.status).toBe('healthy')
    expect(burndown.usedRatio).toBeCloseTo(0.5, 10)
  })

  it('warns at exactly 80% of the allowance', () => {
    expect(buildComputeBurndown([point(79.9)], 100, threshold).status).toBe('healthy')
    expect(buildComputeBurndown([point(80)], 100, threshold).status).toBe('warning')
  })

  it('reports exhausted at and beyond the allowance', () => {
    expect(buildComputeBurndown([point(100)], 100, threshold).status).toBe('exhausted')
    expect(buildComputeBurndown([point(140)], 100, threshold).status).toBe('exhausted')
  })

  it('never reports negative remaining hours', () => {
    expect(buildComputeBurndown([point(140)], 100, threshold).remainingHours).toBe(0)
  })

  it('exposes the warning line so the chart and the status agree', () => {
    expect(buildComputeBurndown([point(10)], 500, threshold).warningHours).toBe(400)
  })

  it('treats a plan with no allowance as unlimited rather than faking a denominator', () => {
    const burndown = buildComputeBurndown([point(900)], null, threshold)
    expect(burndown.status).toBe('unlimited')
    expect(burndown.allowanceHours).toBeNull()
    expect(burndown.remainingHours).toBeNull()
    expect(burndown.usedRatio).toBeNull()
    expect(burndown.warningHours).toBeNull()
    expect(burndown.usedHours).toBe(900)
  })

  it('treats a zero allowance as unlimited rather than dividing by zero', () => {
    const burndown = buildComputeBurndown([point(5)], 0, threshold)
    expect(burndown.status).toBe('unlimited')
    expect(burndown.usedRatio).toBeNull()
  })

  it('handles an empty series', () => {
    const burndown = buildComputeBurndown([], 100, threshold)
    expect(burndown.points).toEqual([])
    expect(burndown.usedHours).toBe(0)
    expect(burndown.status).toBe('healthy')
  })
})

describe('aggregateUsageBySize', () => {
  it('groups rows by size and weights the compute units', () => {
    const result = aggregateUsageBySize([
      { size: '2gb-1vcpu', activeHours: 10 },
      { size: '4gb-2vcpu', activeHours: 10 },
      { size: '2gb-1vcpu', activeHours: 5 },
    ])

    expect(result).toEqual([
      { size: '4gb-2vcpu', activeHours: 10, computeUnits: 20 },
      { size: '2gb-1vcpu', activeHours: 15, computeUnits: 15 },
    ])
  })

  it('sorts by compute units, so the heaviest size leads', () => {
    const result = aggregateUsageBySize([
      { size: '2gb-1vcpu', activeHours: 30 },
      { size: '4gb-2vcpu', activeHours: 20 },
    ])
    expect(result.map((entry) => entry.size)).toEqual(['4gb-2vcpu', '2gb-1vcpu'])
  })

  it('returns an empty array for no rows', () => {
    expect(aggregateUsageBySize([])).toEqual([])
  })
})

describe('getUsageConcentration', () => {
  it('reports the share taken by the largest consumer', () => {
    expect(getUsageConcentration([{ computeUnits: 75 }, { computeUnits: 25 }])).toBeCloseTo(
      0.75,
      10
    )
  })

  it('reports 1 when a single project accounts for everything', () => {
    expect(getUsageConcentration([{ computeUnits: 40 }])).toBe(1)
  })

  it('returns 0 rather than NaN when there is no usage', () => {
    expect(getUsageConcentration([])).toBe(0)
    expect(getUsageConcentration([{ computeUnits: 0 }, { computeUnits: 0 }])).toBe(0)
  })
})

describe('formatting', () => {
  it('shows one decimal for small hour counts and none for large', () => {
    expect(formatComputeHours(4.25)).toBe('4.3 hrs')
    expect(formatComputeHours(1250.6)).toBe('1,251 hrs')
  })

  it('abbreviates large request counts', () => {
    expect(formatComputeRequests(842)).toBe('842')
    expect(formatComputeRequests(12_400)).toBe('12.4K')
    expect(formatComputeRequests(3_200_000)).toBe('3.2M')
  })

  it('formats compute units consistently with hours', () => {
    expect(formatComputeUnits(2.44)).toBe('2.4')
    expect(formatComputeUnits(18_500)).toBe('18,500')
  })
})
