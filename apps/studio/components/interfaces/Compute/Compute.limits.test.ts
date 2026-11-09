import { describe, expect, it } from 'vitest'

import {
  canPlanDeploySize,
  COMPUTE_ALPHA_LIMITS,
  COMPUTE_INCLUDED_VCPU_MINUTES,
  COMPUTE_PLAN_LIMITS,
  getComputeLimits,
  includedRuntimeMinutesForSize,
  includedVcpuHours,
} from './Compute.limits'
import type { OrgPlan } from '@/data/subscriptions/types'

const PAID_PLANS = ['pro', 'team', 'platform', 'enterprise'] as const
const ALL_PLANS = ['free', ...PAID_PLANS] as const

describe('getComputeLimits', () => {
  it('ignores the plan in alpha mode', () => {
    expect(getComputeLimits('alpha', 'enterprise')).toBe(COMPUTE_ALPHA_LIMITS)
    expect(getComputeLimits('alpha', undefined)).toBe(COMPUTE_ALPHA_LIMITS)
  })

  it('looks up the plan in plans mode', () => {
    expect(getComputeLimits('plans', 'pro')).toBe(COMPUTE_PLAN_LIMITS.pro)
  })

  it('falls back to Free for a missing or unknown plan', () => {
    // Simulates the API returning a plan id this table doesn't know yet.
    const unknownPlan = 'some-future-plan' as OrgPlan['id']
    expect(getComputeLimits('plans', undefined)).toBe(COMPUTE_PLAN_LIMITS.free)
    expect(getComputeLimits('plans', unknownPlan)).toBe(COMPUTE_PLAN_LIMITS.free)
  })

  it('does not meter usage during the private alpha', () => {
    expect(COMPUTE_ALPHA_LIMITS.vcpuMinutes).toBeNull()
  })
})

/**
 * These assert conformance with the pricing RFC. If the RFC moves, these should fail — that
 * is the point. Do not relax one without changing the RFC first.
 */
describe('pricing RFC conformance', () => {
  it('includes 500 vCPU-minutes per cycle, on every plan alike', () => {
    expect(COMPUTE_INCLUDED_VCPU_MINUTES).toBe(500)
    for (const plan of ALL_PLANS) {
      expect(COMPUTE_PLAN_LIMITS[plan].vcpuMinutes).toBe(500)
    }
  })

  it('expresses the included quota as 8h20m when compared against an hours rollup', () => {
    expect(includedVcpuHours(COMPUTE_PLAN_LIMITS.free)).toBeCloseTo(8.3333, 3)
    expect(includedVcpuHours(COMPUTE_ALPHA_LIMITS)).toBeNull()
  })

  it('keeps the RFC figure intact at the 1 vCPU base size', () => {
    // 500 vCPU-minutes on a 1 vCPU instance is 500 minutes of wall clock — the same number
    // the RFC quotes, which is why the unit can change without renegotiating it.
    expect(includedRuntimeMinutesForSize(COMPUTE_PLAN_LIMITS.free, 1)).toBe(500)
  })

  it('makes a larger instance consume the quota proportionally faster', () => {
    // A 2 vCPU instance buys half the wall clock for the same allowance, which is the whole
    // point of metering in vCPU-minutes rather than runtime.
    expect(includedRuntimeMinutesForSize(COMPUTE_PLAN_LIMITS.pro, 2)).toBe(250)
    expect(includedRuntimeMinutesForSize(COMPUTE_PLAN_LIMITS.pro, 4)).toBe(125)
  })

  it('returns null rather than dividing by zero for a nonsense size', () => {
    expect(includedRuntimeMinutesForSize(COMPUTE_PLAN_LIMITS.pro, 0)).toBeNull()
    expect(includedRuntimeMinutesForSize(COMPUTE_ALPHA_LIMITS, 1)).toBeNull()
  })

  it('gives Free a single concurrent worker', () => {
    expect(COMPUTE_PLAN_LIMITS.free.concurrentWorkers).toBe(1)
  })

  it('leaves paid concurrency undecided rather than inventing a figure', () => {
    // RFC: "# Concurrent Workers to be decided each tier (or no limit if capacity is not a
    // concern)". Null models "not yet decided"; a number here would read as settled.
    for (const plan of PAID_PLANS) {
      expect(COMPUTE_PLAN_LIMITS[plan].concurrentWorkers).toBeNull()
    }
  })

  it('restricts Free to the 1 vCPU / 2 GB base size', () => {
    expect(COMPUTE_PLAN_LIMITS.free.sizes).toEqual(['2gb-1vcpu'])
    expect(canPlanDeploySize(COMPUTE_PLAN_LIMITS.free, '2gb-1vcpu')).toBe(true)
    expect(canPlanDeploySize(COMPUTE_PLAN_LIMITS.free, '4gb-2vcpu')).toBe(false)
  })

  it('opens both sizes on paid plans', () => {
    for (const plan of PAID_PLANS) {
      expect(canPlanDeploySize(COMPUTE_PLAN_LIMITS[plan], '4gb-2vcpu')).toBe(true)
    }
  })

  it('bursts paid plans to 4 vCPU / 8 GB, and does not burst Free', () => {
    expect(COMPUTE_PLAN_LIMITS.free.burstTo).toBeNull()
    for (const plan of PAID_PLANS) {
      expect(COMPUTE_PLAN_LIMITS[plan].burstTo).toEqual({ vcpu: 4, memoryGb: 8 })
    }
  })

  it('caps a Free invocation and leaves paid invocations uncapped', () => {
    // RFC quotes 5–10 minutes for Free; the upper bound is taken.
    expect(COMPUTE_PLAN_LIMITS.free.maxInvocationMinutes).toBe(10)
    for (const plan of PAID_PLANS) {
      expect(COMPUTE_PLAN_LIMITS[plan].maxInvocationMinutes).toBeNull()
    }
  })

  it('differentiates paid from free by something other than the quota', () => {
    // The quota is deliberately identical, so the tiers have to differ elsewhere or the
    // packaging says nothing.
    const free = COMPUTE_PLAN_LIMITS.free
    for (const plan of PAID_PLANS) {
      const paid = COMPUTE_PLAN_LIMITS[plan]
      expect(paid.vcpuMinutes).toBe(free.vcpuMinutes)
      const differs =
        paid.sizes.length !== free.sizes.length ||
        paid.burstTo !== free.burstTo ||
        paid.maxInvocationMinutes !== free.maxInvocationMinutes ||
        paid.concurrentWorkers !== free.concurrentWorkers
      expect(differs).toBe(true)
    }
  })
})
