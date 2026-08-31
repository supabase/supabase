import { describe, expect, it } from 'vitest'

import { FREE_PLAN_GAPS, isPlanChangeEligible, PRO_PLAN_GAPS } from './plan-presentation'
import { MANAGED_BY } from '@/lib/constants/infrastructure'

describe('isPlanChangeEligible', () => {
  const baseArgs = {
    managedBy: 'supabase' as const,
    billingPartner: null as string | null | undefined,
    currentPlanId: 'free',
    canUpdateSubscription: true,
  }

  it('returns true for a standard free-plan org with billing permissions', () => {
    expect(isPlanChangeEligible(baseArgs)).toBe(true)
  })

  it('returns false for Stripe-managed orgs', () => {
    expect(isPlanChangeEligible({ ...baseArgs, managedBy: MANAGED_BY.STRIPE_PROJECTS })).toBe(false)
  })

  it('returns false for AWS Marketplace orgs', () => {
    expect(isPlanChangeEligible({ ...baseArgs, managedBy: MANAGED_BY.AWS_MARKETPLACE })).toBe(false)
  })

  it('returns false for partner-billed orgs', () => {
    expect(isPlanChangeEligible({ ...baseArgs, billingPartner: 'aws_marketplace' })).toBe(false)
  })

  it('returns false for enterprise plan', () => {
    expect(isPlanChangeEligible({ ...baseArgs, currentPlanId: 'enterprise' })).toBe(false)
  })

  it('returns false for platform plan', () => {
    expect(isPlanChangeEligible({ ...baseArgs, currentPlanId: 'platform' })).toBe(false)
  })

  it('returns false when user cannot update subscription', () => {
    expect(isPlanChangeEligible({ ...baseArgs, canUpdateSubscription: false })).toBe(false)
  })

  it('returns true for pro-plan org with billing permissions', () => {
    expect(isPlanChangeEligible({ ...baseArgs, currentPlanId: 'pro' })).toBe(true)
  })
})

describe('gap lists', () => {
  it('FREE_PLAN_GAPS includes backups and email support as missing', () => {
    const missing = FREE_PLAN_GAPS.filter((g) => g.type === 'missing')
    expect(missing.map((g) => g.label)).toContain('Daily backups')
    expect(missing.map((g) => g.label)).toContain('Email support')
  })

  it('FREE_PLAN_GAPS shows log retention as lesser, not missing', () => {
    const logRetention = FREE_PLAN_GAPS.find((g) => g.label.includes('log retention'))
    expect(logRetention).toBeDefined()
    expect(logRetention!.type).toBe('lesser')
  })

  it('PRO_PLAN_GAPS includes SOC2 and SSO as missing', () => {
    const missing = PRO_PLAN_GAPS.filter((g) => g.type === 'missing')
    expect(missing.map((g) => g.label)).toContain('SOC2 & ISO 27001')
    expect(missing.map((g) => g.label)).toContain('SSO for Supabase Dashboard')
  })
})
