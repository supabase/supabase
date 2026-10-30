import { describe, expect, it } from 'vitest'

import { parseComputeSize } from './Compute.utils'
import {
  COMPUTE_ACTIVE_HOURS_ALLOWANCE,
  COMPUTE_ALLOWANCE_WARNING_THRESHOLD,
  COMPUTE_DEPLOYMENT_ALLOWANCE,
  COMPUTE_INSTANCE_ALLOWANCE,
  getComputeActiveHoursAllowance,
  getComputeDeploymentAllowance,
  getComputeInstanceAllowance,
} from './ComputeUsage.constants'
import {
  aggregateUsageBySize,
  buildComputeBurndown,
  formatComputeHours,
  formatComputeRequests,
  formatGbHours,
  formatVcpuHours,
  getUsageConcentration,
  toGbHours,
  toVcpuHours,
  type ComputeUsagePoint,
} from './ComputeUsage.utils'
import type { OrgPlan } from '@/data/subscriptions/types'

const point = (activeHours: number, timestamp = '2026-10-01T00:00:00.000Z'): ComputeUsagePoint => ({
  timestamp,
  activeHours,
  vcpuHours: activeHours,
  gbHours: activeHours * 2,
  instances: 1,
  requests: 0,
})

describe('size parsing', () => {
  it('reads the memory and vCPU the size reserves', () => {
    expect(parseComputeSize('2gb-1vcpu')).toEqual({ memoryGb: 2, vcpu: 1 })
    expect(parseComputeSize('4gb-2vcpu')).toEqual({ memoryGb: 4, vcpu: 2 })
  })

  it('returns undefined for a shape it does not recognise, rather than guessing', () => {
    expect(parseComputeSize('something-new')).toBeUndefined()
    expect(parseComputeSize('')).toBeUndefined()
  })

  it('parses a size it has never seen, as long as the shape holds', () => {
    expect(parseComputeSize('16gb-8vcpu')).toEqual({ memoryGb: 16, vcpu: 8 })
  })
})

describe('resource-hours', () => {
  it('multiplies active hours by the vCPU the size reserves', () => {
    expect(toVcpuHours(10, '2gb-1vcpu')).toBe(10)
    expect(toVcpuHours(10, '4gb-2vcpu')).toBe(20)
  })

  it('multiplies active hours by the memory the size reserves', () => {
    expect(toGbHours(10, '2gb-1vcpu')).toBe(20)
    expect(toGbHours(10, '4gb-2vcpu')).toBe(40)
  })

  it('contributes nothing for an unparseable size rather than inventing a figure', () => {
    expect(toVcpuHours(10, 'something-new')).toBe(0)
    expect(toGbHours(10, 'something-new')).toBe(0)
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

  it('falls back to the free allowance for a missing plan', () => {
    expect(getComputeActiveHoursAllowance(undefined)).toBe(50)
  })

  it('falls back to the free allowance for a plan id the table does not know', () => {
    // The plan union is closed at compile time, but the API can start returning a new id
    // before this table is updated. The cast reproduces that case deliberately.
    const unknownPlan = 'some-future-plan' as OrgPlan['id']
    expect(getComputeActiveHoursAllowance(unknownPlan)).toBe(50)
    expect(getComputeDeploymentAllowance(unknownPlan)).toBe(1)
    expect(getComputeInstanceAllowance(unknownPlan)).toBe(1)
  })

  it('covers every plan the API can return, so none silently falls back', () => {
    const plans: OrgPlan['id'][] = ['free', 'pro', 'team', 'platform', 'enterprise']
    for (const plan of plans) {
      expect(COMPUTE_ACTIVE_HOURS_ALLOWANCE).toHaveProperty(plan)
      expect(COMPUTE_DEPLOYMENT_ALLOWANCE).toHaveProperty(plan)
      expect(COMPUTE_INSTANCE_ALLOWANCE).toHaveProperty(plan)
    }
  })
})

describe('plan deployment allowances', () => {
  it('returns the configured compute limit per plan', () => {
    expect(getComputeDeploymentAllowance('free')).toBe(1)
    expect(getComputeDeploymentAllowance('pro')).toBe(5)
    expect(getComputeDeploymentAllowance('team')).toBe(15)
  })

  it('returns null for enterprise, which has no fixed limit', () => {
    expect(getComputeDeploymentAllowance('enterprise')).toBeNull()
  })
})

describe('plan instance allowances', () => {
  it('returns the configured instance limit per plan', () => {
    expect(getComputeInstanceAllowance('free')).toBe(1)
    expect(getComputeInstanceAllowance('pro')).toBe(10)
    expect(getComputeInstanceAllowance('team')).toBe(25)
  })

  it('returns null for enterprise, which has no fixed limit', () => {
    expect(getComputeInstanceAllowance('enterprise')).toBeNull()
  })

  it('falls back to the free limit for a missing plan', () => {
    expect(getComputeInstanceAllowance(undefined)).toBe(1)
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
  it('groups active hours by size and derives the resource-hours each reserves', () => {
    const result = aggregateUsageBySize([
      { size: '2gb-1vcpu', activeHours: 10 },
      { size: '4gb-2vcpu', activeHours: 10 },
      { size: '2gb-1vcpu', activeHours: 5 },
    ])

    expect(result).toEqual([
      { size: '2gb-1vcpu', activeHours: 15, vcpuHours: 15, gbHours: 30 },
      { size: '4gb-2vcpu', activeHours: 10, vcpuHours: 20, gbHours: 40 },
    ])
  })

  it('sorts by active hours, the measure the section is titled after', () => {
    const result = aggregateUsageBySize([
      { size: '2gb-1vcpu', activeHours: 30 },
      { size: '4gb-2vcpu', activeHours: 20 },
    ])
    expect(result.map((entry) => entry.size)).toEqual(['2gb-1vcpu', '4gb-2vcpu'])
  })

  it('returns an empty array for no rows', () => {
    expect(aggregateUsageBySize([])).toEqual([])
  })
})

describe('getUsageConcentration', () => {
  it('reports the share of active hours taken by the largest consumer', () => {
    expect(getUsageConcentration([{ activeHours: 75 }, { activeHours: 25 }])).toBeCloseTo(0.75, 10)
  })

  it('reports 1 when a single project accounts for everything', () => {
    expect(getUsageConcentration([{ activeHours: 40 }])).toBe(1)
  })

  it('returns 0 rather than NaN when there is no usage', () => {
    expect(getUsageConcentration([])).toBe(0)
    expect(getUsageConcentration([{ activeHours: 0 }, { activeHours: 0 }])).toBe(0)
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

  it('names the unit on resource-hours so they cannot be confused with wall-clock hours', () => {
    expect(formatVcpuHours(2.44)).toBe('2.4 vCPU-hrs')
    expect(formatGbHours(18_500)).toBe('18,500 GB-hrs')
  })
})
