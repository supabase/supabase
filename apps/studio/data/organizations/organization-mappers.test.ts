import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/data/fetchers', () => ({
  get: vi.fn(),
  handleError: vi.fn(),
}))

const { castOrganizationSlugResponseToOrganization } = await import('./organization-query')
const { castOrganizationResponseToOrganization } = await import('./organizations-query')
const { MANAGED_BY } = await import('@/lib/constants/infrastructure')

const baseOrganizationResponse = {
  billing_email: 'billing@example.com',
  billing_partner: null,
  id: 1,
  integration_source: null,
  is_owner: true,
  name: 'Toolshed',
  opt_in_tags: [] as string[],
  organization_missing_address: false,
  organization_missing_tax_id: false,
  organization_requires_mfa: false,
  plan: { id: 'pro' as const, name: 'Pro' },
  restriction_data: null,
  restriction_status: null,
  slug: 'toolshed',
  stripe_customer_id: 'cus_123',
  subscription_id: 'sub_123',
  usage_billing_enabled: true,
}

const baseOrganizationSlugResponse = {
  billing_email: 'billing@example.com',
  billing_partner: null,
  has_oriole_project: false,
  id: 1,
  integration_source: null,
  name: 'Toolshed',
  opt_in_tags: [] as string[],
  plan: { id: 'pro' as const, name: 'Pro' },
  restriction_data: null,
  restriction_status: null,
  slug: 'toolshed',
  usage_billing_enabled: true,
}

describe('organization query mappers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps billing_partner unchanged while deriving Stripe display state from integration_source', () => {
    const organization = castOrganizationResponseToOrganization({
      ...baseOrganizationResponse,
      integration_source: 'stripe_projects',
    })

    expect(organization.billing_partner).toBeNull()
    expect(organization.integration_source).toBe('stripe_projects')
    expect(organization.managed_by).toBe(MANAGED_BY.STRIPE_PROJECTS)
  })

  it('lets billing_partner win over integration_source for organization list data', () => {
    const organization = castOrganizationResponseToOrganization({
      ...baseOrganizationResponse,
      billing_partner: 'aws_marketplace',
      integration_source: 'stripe_projects',
    })

    expect(organization.billing_partner).toBe('aws_marketplace')
    expect(organization.managed_by).toBe(MANAGED_BY.AWS_MARKETPLACE)
  })

  it('derives Stripe display state for organization detail data without rewriting billing_partner', () => {
    const organization = castOrganizationSlugResponseToOrganization({
      ...baseOrganizationSlugResponse,
      integration_source: 'stripe_projects',
    })

    expect(organization.billing_partner).toBeNull()
    expect(organization.integration_source).toBe('stripe_projects')
    expect(organization.managed_by).toBe(MANAGED_BY.STRIPE_PROJECTS)
  })
})
