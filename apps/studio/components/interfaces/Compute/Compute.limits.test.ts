import { describe, expect, it } from 'vitest'

import { COMPUTE_ALPHA_LIMITS, COMPUTE_PLAN_LIMITS, getComputeLimits } from './Compute.limits'
import type { OrgPlan } from '@/data/subscriptions/types'

const HOURS_PER_MONTH_ALWAYS_ON = 730
const PAID_PLANS = ['pro', 'team', 'platform'] as const

describe('getComputeLimits', () => {
  it('ignores the plan in alpha mode', () => {
    expect(getComputeLimits('alpha', 'enterprise')).toBe(COMPUTE_ALPHA_LIMITS)
    expect(getComputeLimits('alpha', undefined)).toBe(COMPUTE_ALPHA_LIMITS)
  })

  it('looks up the plan in plans mode', () => {
    expect(getComputeLimits('plans', 'pro')).toBe(COMPUTE_PLAN_LIMITS.pro)
    expect(getComputeLimits('plans', 'enterprise').instances).toBeNull()
  })

  it('falls back to Free for a missing or unknown plan', () => {
    // Simulates the API returning a plan id this table doesn't know yet.
    const unknownPlan = 'some-future-plan' as OrgPlan['id']
    expect(getComputeLimits('plans', undefined)).toBe(COMPUTE_PLAN_LIMITS.free)
    expect(getComputeLimits('plans', unknownPlan)).toBe(COMPUTE_PLAN_LIMITS.free)
  })
})

describe('plan limit magnitudes', () => {
  it('gives every paid plan room for at least one always-on instance', () => {
    for (const plan of PAID_PLANS) {
      expect(COMPUTE_PLAN_LIMITS[plan].activeHours).toBeGreaterThanOrEqual(
        HOURS_PER_MONTH_ALWAYS_ON
      )
    }
  })

  it('never offers more instances than the hours could feed', () => {
    for (const { activeHours, instances } of Object.values(COMPUTE_PLAN_LIMITS)) {
      if (activeHours === null || instances === null) continue
      expect(instances).toBeLessThanOrEqual(activeHours)
    }
  })
})
