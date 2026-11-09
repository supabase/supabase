import { describe, expect, it } from 'vitest'

import { COMPUTE_ALLOWANCE_WARNING_THRESHOLD } from './Compute.limits'
import { parseComputeSize } from './Compute.utils'
import {
  aggregateUsageBySize,
  buildComputeBurndown,
  formatCapacityQuota,
  formatComputeHours,
  formatComputeRequests,
  formatGbHours,
  formatPercentage,
  formatVcpuHours,
  formatVcpuQuota,
  getComputeCapacity,
  getCpuUtilization,
  getUsageConcentration,
  toGbHours,
  toVcpuHours,
  type ComputeUsagePoint,
} from './ComputeUsage.utils'

const point = (
  reservedVcpuHours: number,
  timestamp = '2026-10-01T00:00:00.000Z'
): ComputeUsagePoint => ({
  timestamp,
  runningHours: reservedVcpuHours,
  reservedVcpuHours,
  usedVcpuHours: reservedVcpuHours / 4,
  gbHours: reservedVcpuHours * 2,
  instances: 1,
  requests: 0,
})

const selectVcpu = (usage: ComputeUsagePoint) => usage.reservedVcpuHours

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
  it('multiplies running hours by the vCPU the size reserves', () => {
    expect(toVcpuHours(10, '2gb-1vcpu')).toBe(10)
    expect(toVcpuHours(10, '4gb-2vcpu')).toBe(20)
  })

  it('multiplies running hours by the memory the size reserves', () => {
    expect(toGbHours(10, '2gb-1vcpu')).toBe(20)
    expect(toGbHours(10, '4gb-2vcpu')).toBe(40)
  })

  it('contributes nothing for an unparseable size rather than inventing a figure', () => {
    expect(toVcpuHours(10, 'something-new')).toBe(0)
    expect(toGbHours(10, 'something-new')).toBe(0)
  })
})

describe('buildComputeBurndown', () => {
  const threshold = COMPUTE_ALLOWANCE_WARNING_THRESHOLD

  it('accumulates the selected measure across buckets', () => {
    const burndown = buildComputeBurndown(
      [point(10), point(5), point(2.5)],
      selectVcpu,
      100,
      threshold
    )
    expect(burndown.points.map((p) => p.used)).toEqual([10, 15, 17.5])
    expect(burndown.used).toBe(17.5)
    expect(burndown.remaining).toBe(82.5)
  })

  it('reports healthy below the warning threshold', () => {
    const burndown = buildComputeBurndown([point(50)], selectVcpu, 100, threshold)
    expect(burndown.status).toBe('healthy')
    expect(burndown.usedRatio).toBeCloseTo(0.5, 10)
  })

  it('warns at exactly 80% of the allowance', () => {
    expect(buildComputeBurndown([point(79.9)], selectVcpu, 100, threshold).status).toBe('healthy')
    expect(buildComputeBurndown([point(80)], selectVcpu, 100, threshold).status).toBe('warning')
  })

  it('reports exhausted at and beyond the allowance', () => {
    expect(buildComputeBurndown([point(100)], selectVcpu, 100, threshold).status).toBe('exhausted')
    expect(buildComputeBurndown([point(140)], selectVcpu, 100, threshold).status).toBe('exhausted')
  })

  it('never reports a negative remainder', () => {
    expect(buildComputeBurndown([point(140)], selectVcpu, 100, threshold).remaining).toBe(0)
  })

  it('exposes the warning line so the chart and the status agree', () => {
    expect(buildComputeBurndown([point(10)], selectVcpu, 500, threshold).warningAt).toBe(400)
  })

  it('treats a plan with no allowance as unlimited rather than faking a denominator', () => {
    const burndown = buildComputeBurndown([point(900)], selectVcpu, null, threshold)
    expect(burndown.status).toBe('unlimited')
    expect(burndown.allowance).toBeNull()
    expect(burndown.remaining).toBeNull()
    expect(burndown.usedRatio).toBeNull()
    expect(burndown.warningAt).toBeNull()
    expect(burndown.used).toBe(900)
  })

  it('treats a zero allowance as unlimited rather than dividing by zero', () => {
    const burndown = buildComputeBurndown([point(5)], selectVcpu, 0, threshold)
    expect(burndown.status).toBe('unlimited')
    expect(burndown.usedRatio).toBeNull()
  })

  it('accumulates whichever measure it is given', () => {
    const burndown = buildComputeBurndown([point(10)], (usage) => usage.gbHours, 100, threshold)
    expect(burndown.used).toBe(20)
  })

  it('handles an empty series', () => {
    const burndown = buildComputeBurndown([], selectVcpu, 100, threshold)
    expect(burndown.points).toEqual([])
    expect(burndown.used).toBe(0)
    expect(burndown.status).toBe('healthy')
  })
})

describe('aggregateUsageBySize', () => {
  it('groups running hours by size and derives the resource-hours each reserves', () => {
    const result = aggregateUsageBySize([
      { size: '2gb-1vcpu', runningHours: 10 },
      { size: '4gb-2vcpu', runningHours: 10 },
      { size: '2gb-1vcpu', runningHours: 5 },
    ])

    expect(result).toEqual([
      { size: '2gb-1vcpu', runningHours: 15, reservedVcpuHours: 15, gbHours: 30 },
      { size: '4gb-2vcpu', runningHours: 10, reservedVcpuHours: 20, gbHours: 40 },
    ])
  })

  it('sorts by running hours, the measure the section is titled after', () => {
    const result = aggregateUsageBySize([
      { size: '2gb-1vcpu', runningHours: 30 },
      { size: '4gb-2vcpu', runningHours: 20 },
    ])
    expect(result.map((entry) => entry.size)).toEqual(['2gb-1vcpu', '4gb-2vcpu'])
  })

  it('returns an empty array for no rows', () => {
    expect(aggregateUsageBySize([])).toEqual([])
  })
})

describe('getUsageConcentration', () => {
  it('reports the share taken by the largest consumer', () => {
    expect(getUsageConcentration([75, 25])).toBeCloseTo(0.75, 10)
  })

  it('reports 1 when a single project accounts for everything', () => {
    expect(getUsageConcentration([40])).toBe(1)
  })

  it('returns 0 rather than NaN when there is no usage', () => {
    expect(getUsageConcentration([])).toBe(0)
    expect(getUsageConcentration([0, 0])).toBe(0)
  })
})

describe('getCpuUtilization', () => {
  it('reports the share of reserved vCPU that did work', () => {
    expect(getCpuUtilization(25, 100)).toBeCloseTo(0.25, 10)
  })

  it('returns null when nothing was reserved', () => {
    expect(getCpuUtilization(0, 0)).toBeNull()
  })

  it('caps at 1 when used exceeds reserved', () => {
    expect(getCpuUtilization(120, 100)).toBe(1)
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

  it('rounds percentages to whole numbers', () => {
    expect(formatPercentage(0.256)).toBe('26%')
  })
})

describe('getComputeCapacity', () => {
  it('reports no cap when the plan sets none', () => {
    const capacity = getComputeCapacity(12, null)
    expect(capacity.status).toBe('unlimited')
    expect(capacity.remaining).toBeNull()
    expect(capacity.label).toBeNull()
  })

  it('counts down the slots that are left', () => {
    expect(getComputeCapacity(3, 10)).toMatchObject({
      status: 'available',
      remaining: 7,
      label: 'Room for 7 more',
    })
  })

  it('warns on absolute headroom rather than percentage used', () => {
    // 8 of 10 and 40 of 50 are the same ratio, but only one is about to block a deploy.
    expect(getComputeCapacity(8, 10).status).toBe('low')
    expect(getComputeCapacity(40, 50).status).toBe('available')
  })

  it('treats a full capacity limit as full, not exceeded', () => {
    expect(getComputeCapacity(1, 1)).toMatchObject({
      status: 'full',
      remaining: 0,
      label: 'No room for more',
    })
  })

  it('reports how far over the limit a project has gone', () => {
    expect(getComputeCapacity(12, 10)).toMatchObject({
      status: 'exceeded',
      remaining: -2,
      label: '2 over the limit',
    })
  })

  it('leaves a single free slot phrased as one', () => {
    expect(getComputeCapacity(9, 10).label).toBe('Room for 1 more')
  })
})

describe('formatVcpuQuota', () => {
  it('reads both sides in the unit the allowance sets', () => {
    // 1,067 vCPU-hours against a 500 vCPU-minute quota: scaling each side on its own size is
    // what produced "1,067 vCPU-hrs of 500 vCPU-min", which compares nothing.
    expect(formatVcpuQuota(1067, 500 / 60)).toBe('64,020/500 vCPU-min')
  })

  it('states the unit once, after the pair', () => {
    expect(formatVcpuQuota(7.2, 500 / 60)).toBe('432/500 vCPU-min')
  })

  it('moves both sides to hours when the allowance is large', () => {
    expect(formatVcpuQuota(900, 1000)).toBe('900/1,000 vCPU-hrs')
  })

  it('drops the denominator when there is no allowance', () => {
    expect(formatVcpuQuota(7.2, null)).toBe('432 vCPU-min')
  })
})

describe('formatCapacityQuota', () => {
  it('writes a count pair without a unit', () => {
    expect(formatCapacityQuota(7, 10)).toBe('7/10')
  })

  it('shows the count alone when the plan sets no cap', () => {
    expect(formatCapacityQuota(7, null)).toBe('7')
  })
})
