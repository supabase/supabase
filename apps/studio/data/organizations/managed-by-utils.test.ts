import { describe, expect, it } from 'vitest'

import {
  getManagedByFromOrganizationPartner,
  isPartnerBillingOrganization,
} from './managed-by-utils'
import { MANAGED_BY } from '@/lib/constants/infrastructure'

describe('managed-by-utils', () => {
  it('prefers billing_partner over integration_source when both are present', () => {
    expect(getManagedByFromOrganizationPartner('aws_marketplace', 'stripe_projects')).toBe(
      MANAGED_BY.AWS_MARKETPLACE
    )
  })

  it('maps stripe integration_source to Stripe display state', () => {
    expect(getManagedByFromOrganizationPartner(null, 'stripe_projects')).toBe(
      MANAGED_BY.STRIPE_PROJECTS
    )
  })

  it('falls back to Supabase for unknown values', () => {
    expect(getManagedByFromOrganizationPartner('unknown_partner', 'unknown_source')).toBe(
      MANAGED_BY.SUPABASE
    )
  })

  it('treats billing_partner as the billing ownership signal', () => {
    expect(isPartnerBillingOrganization('vercel_marketplace')).toBe(true)
    expect(isPartnerBillingOrganization(null)).toBe(false)
  })
})
