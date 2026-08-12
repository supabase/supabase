import { describe, expect, it } from 'vitest'

import {
  isOrganizationUpgradableInDashboard,
  isPlanBadgeUpgradeEligible,
} from '../usePlanBadgeUpgradeExperiment'
import { createMockOrganization } from '@/tests/helpers'

describe('isOrganizationUpgradableInDashboard', () => {
  it('accepts a Supabase-managed free-plan organization', () => {
    expect(isOrganizationUpgradableInDashboard(createMockOrganization({}))).toBe(true)
  })

  it('rejects an organization that has not resolved yet', () => {
    expect(isOrganizationUpgradableInDashboard(undefined)).toBe(false)
  })

  it('rejects paid plans', () => {
    const org = createMockOrganization({ plan: { id: 'pro', name: 'Pro' } })
    expect(isOrganizationUpgradableInDashboard(org)).toBe(false)
  })

  // Partner-managed orgs change plans through the partner — PlanUpdateSidePanel disables
  // every paid tier for them, so the badge would link to a panel with no enabled action.
  it.each([['vercel-marketplace'], ['aws-marketplace'], ['stripe-projects']])(
    'rejects organizations managed by %s',
    (managedBy) => {
      const org = createMockOrganization({ managed_by: managedBy })
      expect(isOrganizationUpgradableInDashboard(org)).toBe(false)
    }
  )

  // `getManagedByFromOrganizationPartner` has no case for `fly`, so it falls through to
  // `supabase` — but PlanUpdateSidePanel still disables every paid tier for any org with a
  // billing partner. The `billing_partner` check is what catches this.
  it('rejects organizations with a billing partner that managed_by does not map', () => {
    const org = createMockOrganization({ managed_by: 'supabase', billing_partner: 'fly' })
    expect(isOrganizationUpgradableInDashboard(org)).toBe(false)
  })
})

describe('isPlanBadgeUpgradeEligible', () => {
  it('accepts an upgradable organization when the user can reach billing', () => {
    expect(isPlanBadgeUpgradeEligible(createMockOrganization({}), true)).toBe(true)
  })

  it('rejects when billing is disabled for the user, since the billing page 404s', () => {
    expect(isPlanBadgeUpgradeEligible(createMockOrganization({}), false)).toBe(false)
  })

  it('rejects a non-upgradable organization even when billing is enabled', () => {
    const org = createMockOrganization({ managed_by: 'vercel-marketplace' })
    expect(isPlanBadgeUpgradeEligible(org, true)).toBe(false)
  })
})
