import { plans as subscriptionsPlans } from 'shared-data/plans'
import { describe, expect, it } from 'vitest'

import { computeFeaturesFor, withComputeFeatures } from './planComputeFeatures'
import { COMPUTE_PLAN_LIMITS } from '@/components/interfaces/Compute/Compute.limits'

const flatten = (features: (string | string[])[]) =>
  features.flatMap((feature) => (typeof feature === 'string' ? [feature] : feature)).join(' | ')

describe('computeFeaturesFor', () => {
  it('states the included quota, which the RFC sets at 500 on every plan', () => {
    for (const planId of ['free', 'pro', 'team', 'enterprise'] as const) {
      expect(flatten(computeFeaturesFor(planId))).toContain('500 vCPU-minutes of Compute')
    }
  })

  it('says paid plans keep going past the quota, and Free does not', () => {
    expect(flatten(computeFeaturesFor('pro'))).toContain('then pay as you go')
    expect(flatten(computeFeaturesFor('free'))).not.toContain('then pay as you go')
  })

  it('names the concurrency limit on each plan that has one', () => {
    expect(flatten(computeFeaturesFor('free'))).toContain('1 concurrent instance')
    expect(flatten(computeFeaturesFor('pro'))).toContain('10 concurrent instances')
    expect(flatten(computeFeaturesFor('team'))).toContain('50 concurrent instances')
    // Enterprise is negotiated, so there is nothing to state.
    expect(flatten(computeFeaturesFor('enterprise'))).not.toMatch(/concurrent instance/i)
  })

  it('says Free instances suspend and paid plans may run private ones', () => {
    expect(flatten(computeFeaturesFor('free'))).toContain('suspend when idle')
    expect(flatten(computeFeaturesFor('pro'))).toContain('Public and private instances')
  })

  it('restricts Free to the base size and bursts paid plans', () => {
    const free = flatten(computeFeaturesFor('free'))
    expect(free).toContain('2 GB · 1 vCPU')
    expect(free).not.toContain('4 GB · 2 vCPU')
    expect(free).toContain('Runs at its base size')
    expect(flatten(computeFeaturesFor('pro'))).toContain('Bursts to 4 vCPU / 8 GB')
  })

  it('caps the Free invocation and leaves paid uncapped', () => {
    expect(flatten(computeFeaturesFor('free'))).toContain('Up to 10 minutes per invocation')
    expect(flatten(computeFeaturesFor('pro'))).toContain('Uncapped invocation duration')
  })

  it('marks every plan as private alpha, since the product is invite-only', () => {
    for (const planId of ['free', 'pro', 'team', 'enterprise'] as const) {
      expect(flatten(computeFeaturesFor(planId))).toContain('Private alpha')
    }
  })

  it('quotes no price, because the rates are still being validated', () => {
    for (const planId of ['free', 'pro', 'team', 'enterprise'] as const) {
      expect(flatten(computeFeaturesFor(planId))).not.toMatch(/\$|per vCPU-hour|per GB-hour/)
    }
  })

  it('tracks Compute.limits rather than restating it', () => {
    // Changing the gating must move the copy, or the two drift apart.
    expect(flatten(computeFeaturesFor('free'))).toContain(
      `${COMPUTE_PLAN_LIMITS.free.vcpuMinutes} vCPU-minutes`
    )
  })

  it('returns nothing for an unknown plan rather than guessing', () => {
    expect(computeFeaturesFor(undefined)).toEqual([])
  })
})

describe('withComputeFeatures', () => {
  it('appends to the shared-data plan without mutating it', () => {
    const free = subscriptionsPlans.find((plan) => plan.id === 'tier_free')!
    const before = free.features.length
    const augmented = withComputeFeatures(free)

    expect(augmented.features.length).toBeGreaterThan(before)
    expect(free.features).toHaveLength(before)
    expect(augmented.features.slice(0, before)).toEqual(free.features)
  })

  it('covers every plan the pricing cards render', () => {
    for (const plan of subscriptionsPlans) {
      expect(withComputeFeatures(plan).features.length).toBeGreaterThan(plan.features.length)
    }
  })

  it('leaves the rest of the plan untouched', () => {
    const pro = subscriptionsPlans.find((plan) => plan.id === 'tier_pro')!
    const augmented = withComputeFeatures(pro)
    expect(augmented.priceMonthly).toBe(pro.priceMonthly)
    expect(augmented.name).toBe(pro.name)
  })
})
