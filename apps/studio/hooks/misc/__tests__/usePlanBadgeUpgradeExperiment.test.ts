import { describe, expect, it } from 'vitest'

import { isPlanBadgeUpgradeEligible } from '../usePlanBadgeUpgradeExperiment'
import { createMockOrganization } from '@/tests/helpers'

describe('isPlanBadgeUpgradeEligible', () => {
  it('accepts a Supabase-managed free-plan organization', () => {
    expect(isPlanBadgeUpgradeEligible(createMockOrganization({}), true)).toBe(true)
  })

  it('rejects an organization that has not resolved yet', () => {
    expect(isPlanBadgeUpgradeEligible(undefined, true)).toBe(false)
  })

  it('rejects paid plans', () => {
    const org = createMockOrganization({ plan: { id: 'pro', name: 'Pro' } })
    expect(isPlanBadgeUpgradeEligible(org, true)).toBe(false)
  })

  it('rejects when billing is disabled for the user, since the billing page 404s', () => {
    expect(isPlanBadgeUpgradeEligible(createMockOrganization({}), false)).toBe(false)
  })

  // Partner-managed orgs change plans through the partner — PlanUpdateSidePanel disables
  // every paid tier for them, so the badge would link to a panel with no enabled action.
  it.each([['vercel-marketplace'], ['aws-marketplace'], ['stripe-projects']])(
    'rejects organizations managed by %s',
    (managedBy) => {
      const org = createMockOrganization({ managed_by: managedBy })
      expect(isPlanBadgeUpgradeEligible(org, true)).toBe(false)
    }
  )

  // `getManagedByFromOrganizationPartner` has no case for `fly`, so it falls through to
  // `supabase` — but PlanUpdateSidePanel still disables every paid tier for any org with a
  // billing partner. The `billing_partner` check is what catches this.
  it('rejects organizations with a billing partner that managed_by does not map', () => {
    const org = createMockOrganization({ managed_by: 'supabase', billing_partner: 'fly' })
    expect(isPlanBadgeUpgradeEligible(org, true)).toBe(false)
  })
})
