import { type Organization } from '@/types'

export const REDEEM_CREDITS_MOCK_STATES = [
  'loading',
  'ready',
  'redeeming',
  'redeemed',
  'already-redeemed',
  'invalid',
  'wrong-account',
  'error',
] as const

export type RedeemCreditsMockState = (typeof REDEEM_CREDITS_MOCK_STATES)[number]

export const MOCK_SELECTED_ORG_SLUG = 'acme-production'

const createMockOrganization = (details: Partial<Organization>): Organization => ({
  id: 1,
  name: 'Acme Production',
  slug: MOCK_SELECTED_ORG_SLUG,
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

export const MOCK_ORGANIZATIONS = [
  createMockOrganization({ id: 1, name: 'Acme Production', slug: MOCK_SELECTED_ORG_SLUG }),
  createMockOrganization({ id: 2, name: 'Acme Staging', slug: 'acme-staging' }),
  createMockOrganization({ id: 3, name: 'Personal Sandbox', slug: 'personal-sandbox' }),
]

export const EMPTY_ORGANIZATIONS: Organization[] = []
