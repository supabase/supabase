import { describe, expect, it } from 'vitest'

import { dailyUsageToDataPoints, getUsageBranchOptions } from './Usage.utils'
import { PricingMetric } from '@/data/analytics/org-daily-stats-query'
import type { OrgDailyUsageResponse } from '@/data/analytics/org-daily-stats-query'
import { createTestBranch } from '@/tests/lib/branch-test-utils'

describe('dailyUsageToDataPoints', () => {
  it('returns empty array when dailyUsage is undefined', () => {
    const result = dailyUsageToDataPoints(undefined, () => true)
    expect(result).toEqual([])
  })

  it('returns empty array when usages array is empty', () => {
    const dailyUsage: OrgDailyUsageResponse = {
      usages: [],
    }
    const result = dailyUsageToDataPoints(dailyUsage, () => true)
    expect(result).toEqual([])
  })

  it('transforms single usage entry correctly', () => {
    const dailyUsage: OrgDailyUsageResponse = {
      usages: [
        {
          date: '2025-10-01',
          metric: PricingMetric.EGRESS,
          usage: 15,
          usage_original: 15 * 1e9,
          breakdown: null,
        },
      ],
    }

    const result = dailyUsageToDataPoints(dailyUsage, () => true)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      period_start: '2025-10-01',
      periodStartFormatted: '01 Oct',
      egress: 15 * 1e9,
    })
  })

  it('groups multiple metrics by date correctly', () => {
    const dailyUsage: OrgDailyUsageResponse = {
      usages: [
        {
          date: '2025-10-01',
          metric: PricingMetric.EGRESS,
          usage: 1000000,
          usage_original: 1000000,
          breakdown: null,
        },
        {
          date: '2025-10-01',
          metric: PricingMetric.DATABASE_SIZE,
          usage: 5000000,
          usage_original: 5000000,
          breakdown: null,
        },
      ],
    }

    const result = dailyUsageToDataPoints(dailyUsage, () => true)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      period_start: '2025-10-01',
      periodStartFormatted: '01 Oct',
      egress: 1000000,
      database_size: 5000000,
    })
  })

  it('creates separate data points for different dates', () => {
    const dailyUsage: OrgDailyUsageResponse = {
      usages: [
        {
          date: '2025-10-01',
          metric: PricingMetric.EGRESS,
          usage: 1000000,
          usage_original: 1000000,
          breakdown: null,
        },
        {
          date: '2025-10-02',
          metric: PricingMetric.EGRESS,
          usage: 2000000,
          usage_original: 2000000,
          breakdown: null,
        },
      ],
    }

    const result = dailyUsageToDataPoints(dailyUsage, () => true)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      period_start: '2025-10-01',
      periodStartFormatted: '01 Oct',
      egress: 1000000,
    })
    expect(result[1]).toEqual({
      period_start: '2025-10-02',
      periodStartFormatted: '02 Oct',
      egress: 2000000,
    })
  })

  it('includes breakdown data when present', () => {
    const dailyUsage: OrgDailyUsageResponse = {
      usages: [
        {
          date: '2025-10-01',
          metric: PricingMetric.EGRESS,
          usage: 1000000,
          usage_original: 1000000,
          breakdown: {
            egress_rest: 400000,
            egress_realtime: 300000,
            egress_storage: 200000,
            egress_supavisor: 100000,
            egress_function: 0,
            egress_graphql: 0,
            egress_logdrain: 0,
          },
        },
      ],
    }

    const result = dailyUsageToDataPoints(dailyUsage, () => true)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      period_start: '2025-10-01',
      periodStartFormatted: '01 Oct',
      egress: 1000000,
      egress_rest: 400000,
      egress_realtime: 300000,
      egress_storage: 200000,
      egress_supavisor: 100000,
      egress_function: 0,
      egress_graphql: 0,
      egress_logdrain: 0,
    })
  })

  it('handles complex scenario with multiple dates, metrics, and breakdowns', () => {
    const dailyUsage: OrgDailyUsageResponse = {
      usages: [
        {
          date: '2025-10-01',
          metric: PricingMetric.EGRESS,
          usage: 1000000,
          usage_original: 1000000,
          breakdown: {
            egress_rest: 600000,
            egress_realtime: 400000,
            egress_storage: 0,
            egress_supavisor: 0,
            egress_function: 0,
            egress_graphql: 0,
            egress_logdrain: 0,
          },
        },
        {
          date: '2025-10-01',
          metric: PricingMetric.DATABASE_SIZE,
          usage: 5000000,
          usage_original: 5000000,
          breakdown: null,
        },
        {
          date: '2025-10-02',
          metric: PricingMetric.EGRESS,
          usage: 1500000,
          usage_original: 1500000,
          breakdown: {
            egress_rest: 900000,
            egress_realtime: 600000,
            egress_storage: 0,
            egress_supavisor: 0,
            egress_function: 0,
            egress_graphql: 0,
            egress_logdrain: 0,
          },
        },
        {
          date: '2025-10-02',
          metric: PricingMetric.STORAGE_SIZE,
          usage: 2000000,
          usage_original: 2000000,
          breakdown: null,
        },
      ],
    }

    const result = dailyUsageToDataPoints(dailyUsage, () => true)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      period_start: '2025-10-01',
      periodStartFormatted: '01 Oct',
      egress: 1000000,
      egress_rest: 600000,
      egress_realtime: 400000,
      egress_storage: 0,
      egress_supavisor: 0,
      egress_function: 0,
      egress_graphql: 0,
      egress_logdrain: 0,
      database_size: 5000000,
    })
    expect(result[1]).toEqual({
      period_start: '2025-10-02',
      periodStartFormatted: '02 Oct',
      egress: 1500000,
      egress_rest: 900000,
      egress_realtime: 600000,
      egress_storage: 0,
      egress_supavisor: 0,
      egress_function: 0,
      egress_graphql: 0,
      egress_logdrain: 0,
      storage_size: 2000000,
    })
  })

  it('handles zero usage values', () => {
    const dailyUsage: OrgDailyUsageResponse = {
      usages: [
        {
          date: '2025-10-01',
          metric: PricingMetric.EGRESS,
          usage: 0,
          usage_original: 0,
          breakdown: null,
        },
      ],
    }

    const result = dailyUsageToDataPoints(dailyUsage, () => true)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      period_start: '2025-10-01',
      periodStartFormatted: '01 Oct',
      egress: 0,
    })
  })
})

describe('getUsageBranchOptions', () => {
  it('returns no options when there are no branches', () => {
    expect(getUsageBranchOptions(undefined)).toEqual([])
    expect(getUsageBranchOptions([])).toEqual([])
  })

  it('returns no options when the project only has a main branch', () => {
    const branches = [createTestBranch({ name: 'main', project_ref: 'parent', is_default: true })]
    expect(getUsageBranchOptions(branches)).toEqual([])
  })

  it('puts the main branch first, then the newest branches', () => {
    const branches = [
      createTestBranch({
        name: 'older',
        project_ref: 'older-ref',
        created_at: '2026-01-01T00:00:00Z',
      }),
      createTestBranch({ name: 'main', project_ref: 'parent', is_default: true }),
      createTestBranch({
        name: 'newer',
        project_ref: 'newer-ref',
        created_at: '2026-02-01T00:00:00Z',
      }),
    ]

    expect(getUsageBranchOptions(branches).map((branch) => branch.name)).toEqual([
      'main',
      'newer',
      'older',
    ])
  })

  it('returns branches without a main branch', () => {
    const branches = [
      createTestBranch({ name: 'one', project_ref: 'one-ref' }),
      createTestBranch({ name: 'two', project_ref: 'two-ref' }),
    ]

    expect(getUsageBranchOptions(branches).map((branch) => branch.name)).toEqual(['one', 'two'])
  })
})
