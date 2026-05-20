import type {
  CloudMarketplaceContractLinkingEligibility,
  CloudMarketplaceOnboardingInfo,
} from './cloud-marketplace-query'
import type { Organization } from '@/types'

export const AWS_MARKETPLACE_MOCK_STATES = [
  'loading',
  'link-existing',
  'linking',
  'linked',
  'create-new',
  'not-eligible',
  'already-linked',
  'wrong-account',
  'invalid',
  'error',
] as const

export type AwsMarketplaceMockState = (typeof AWS_MARKETPLACE_MOCK_STATES)[number]

export const MOCK_BUYER_ID = 'buyer-mock-123456'
export const MOCK_LINKED_ORG_SLUG = 'acme-production'
export const EMPTY_ORGANIZATIONS: Organization[] = []

const createMockOrganization = (details: Partial<Organization>): Organization => ({
  id: 1,
  name: 'Acme Production',
  slug: MOCK_LINKED_ORG_SLUG,
  plan: { id: 'pro', name: 'Pro' },
  managed_by: 'supabase',
  is_owner: true,
  billing_email: 'billing@example.com',
  billing_partner: null,
  integration_source: null,
  usage_billing_enabled: true,
  stripe_customer_id: 'cus_mock',
  subscription_id: 'sub_mock',
  organization_requires_mfa: false,
  opt_in_tags: [],
  restriction_status: null,
  restriction_data: null,
  organization_missing_address: false,
  organization_missing_tax_id: false,
  ...details,
})

const MOCK_ORGANIZATIONS = [
  createMockOrganization({ id: 1, name: 'Acme Production', slug: MOCK_LINKED_ORG_SLUG }),
  createMockOrganization({ id: 2, name: 'Acme Staging', slug: 'acme-staging' }),
  createMockOrganization({
    id: 3,
    name: 'Legacy Billing',
    slug: 'legacy-billing',
    billing_partner: 'aws_marketplace',
  }),
  createMockOrganization({
    id: 4,
    name: 'Overdue Invoices',
    slug: 'overdue-invoices',
  }),
]

export const getMockAwsOrganizations = (mock: AwsMarketplaceMockState | undefined) =>
  mock === 'create-new' || mock === 'invalid' || mock === 'error'
    ? EMPTY_ORGANIZATIONS
    : MOCK_ORGANIZATIONS

export const createMockAwsEligibility = (
  mock: AwsMarketplaceMockState | undefined
): CloudMarketplaceContractLinkingEligibility => {
  if (mock === 'not-eligible') {
    return createEligibility({ is_eligible: false, reasons: [] })
  }

  if (mock === 'already-linked') {
    return createEligibility({ is_eligible: false, reasons: ['AGREEMENT_BASED_OFFER'] })
  }

  return createEligibility()
}

export const createMockAwsOnboardingInfo = (
  organizations: Organization[],
  overrides: Partial<CloudMarketplaceOnboardingInfo> = {}
): CloudMarketplaceOnboardingInfo => ({
  aws_contract_auto_renewal: true,
  aws_contract_end_date: '2026-12-31T00:00:00.000Z',
  aws_contract_is_private_offer: false,
  aws_contract_settings_url: 'https://aws.amazon.com/marketplace',
  aws_contract_start_date: '2026-01-01T00:00:00.000Z',
  organization_linking_eligibility: organizations.map((organization, index) => ({
    slug: organization.slug,
    is_eligible: index < 2,
    reasons: index < 2 ? [] : ['ALREADY_MANAGED_BY_PARTNER_AWS'],
  })),
  plan_name_selected_on_marketplace: 'Team',
  ...overrides,
})

function createEligibility(
  overrides: Partial<CloudMarketplaceContractLinkingEligibility['eligibility']> = {}
): CloudMarketplaceContractLinkingEligibility {
  return {
    eligibility: {
      is_eligible: true,
      reasons: [],
      aws_agreement_id: 'agreement-mock-123',
      ...overrides,
    },
  }
}
