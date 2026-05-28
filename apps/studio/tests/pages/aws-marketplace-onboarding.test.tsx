import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { LOCAL_STORAGE_KEYS } from 'common'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { AwsMarketplaceOnboardingScreen } from '@/components/interfaces/Organization/CloudMarketplace/AwsMarketplaceOnboarding'
import type {
  CloudMarketplaceContractLinkingEligibility,
  CloudMarketplaceOnboardingInfo,
} from '@/components/interfaces/Organization/CloudMarketplace/cloud-marketplace-query'
import { CREATE_AWS_MANAGED_ORG_FORM_ID } from '@/components/interfaces/Organization/CloudMarketplace/NewAwsMarketplaceOrgForm'
import { API_URL } from '@/lib/constants'
import type { ProfileContextType } from '@/lib/profile'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer } from '@/tests/lib/msw'

type OrganizationResponse = components['schemas']['OrganizationResponse']

const DEFAULT_PROFILE_CONTEXT: ProfileContextType = {
  profile: {
    id: 1,
    auth0_id: 'auth0|test',
    gotrue_id: 'gotrue-test',
    username: 'testuser',
    primary_email: 'test@example.com',
    first_name: null,
    last_name: null,
    mobile: null,
    is_alpha_user: false,
    is_sso_user: false,
    disabled_features: [],
    free_project_limit: null,
  },
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: true,
}

const LINKABLE_ORG = createMockOrganizationResponse({
  id: 1,
  name: 'Acme Production',
  slug: 'acme-production',
  plan: { id: 'pro', name: 'Pro' },
})
const UNAVAILABLE_ORG = createMockOrganizationResponse({
  id: 2,
  name: 'Legacy Billing',
  slug: 'legacy-billing',
  plan: { id: 'team', name: 'Team' },
})

const ELIGIBLE_CONTRACT: CloudMarketplaceContractLinkingEligibility = {
  eligibility: {
    is_eligible: true,
    reasons: [],
    aws_agreement_id: 'agreement-test',
  },
}

function createOnboardingInfo({
  organizations = [LINKABLE_ORG, UNAVAILABLE_ORG],
  eligibleSlugs = [LINKABLE_ORG.slug],
}: {
  organizations?: OrganizationResponse[]
  eligibleSlugs?: string[]
} = {}): CloudMarketplaceOnboardingInfo {
  return {
    aws_contract_auto_renewal: true,
    aws_contract_end_date: '2026-12-31T00:00:00.000Z',
    aws_contract_is_private_offer: false,
    aws_contract_settings_url: 'https://aws.amazon.com/marketplace',
    aws_contract_start_date: '2026-01-01T00:00:00.000Z',
    organization_linking_eligibility: organizations.map((organization) => ({
      slug: organization.slug,
      is_eligible: eligibleSlugs.includes(organization.slug),
      reasons: eligibleSlugs.includes(organization.slug) ? [] : ['ALREADY_MANAGED_BY_PARTNER_AWS'],
    })),
    plan_name_selected_on_marketplace: 'Team',
  }
}

function mockAwsEndpoints({
  organizations = [LINKABLE_ORG, UNAVAILABLE_ORG],
  eligibility = ELIGIBLE_CONTRACT,
  onboardingInfo = createOnboardingInfo({ organizations }),
}: {
  organizations?: OrganizationResponse[]
  eligibility?: CloudMarketplaceContractLinkingEligibility
  onboardingInfo?: CloudMarketplaceOnboardingInfo
} = {}) {
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: () => HttpResponse.json<OrganizationResponse[]>(organizations),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/cloud-marketplace/buyers/:buyer_id/contract-linking-eligibility',
    response: () => HttpResponse.json<CloudMarketplaceContractLinkingEligibility>(eligibility),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/cloud-marketplace/buyers/:buyer_id/onboarding-info',
    response: () => HttpResponse.json<CloudMarketplaceOnboardingInfo>(onboardingInfo),
  })
}

function renderScreen(props: Partial<Parameters<typeof AwsMarketplaceOnboardingScreen>[0]> = {}) {
  return customRender(<AwsMarketplaceOnboardingScreen buyerId="buyer-test" {...props} />, {
    profileContext: DEFAULT_PROFILE_CONTEXT,
  })
}

describe('AwsMarketplaceOnboardingScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  test('renders linkable and unavailable organizations and disables link without selection', async () => {
    const user = userEvent.setup()
    mockAwsEndpoints()
    renderScreen()

    await screen.findByText('Acme Production')
    const linkButton = screen.getByRole('button', { name: 'Link organization' })
    expect(linkButton).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /Organizations that can't be linked/ }))
    expect(screen.getByText('Legacy Billing')).toBeInTheDocument()
    expect(screen.getByText('Already linked to AWS Marketplace')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Acme Production/ }))
    expect(linkButton).toBeEnabled()
  })

  test('calls link mutation with buyerId and slug', async () => {
    const user = userEvent.setup()
    let linkRequest: { slug?: string; body?: unknown } | undefined

    mockAwsEndpoints()
    mswServer.use(
      http.put(
        `${API_URL}/platform/organizations/:slug/cloud-marketplace/link`,
        async ({ params, request }) => {
          linkRequest = {
            slug: String(params.slug),
            body: await request.json(),
          }
          return HttpResponse.json({})
        }
      )
    )

    renderScreen()

    await user.click(await screen.findByRole('button', { name: /Acme Production/ }))
    await user.click(screen.getByRole('button', { name: 'Link organization' }))

    await waitFor(() => {
      expect(linkRequest).toEqual({
        slug: 'acme-production',
        body: { buyer_id: 'buyer-test' },
      })
    })
    await screen.findByText('Organization linked')
  })

  test('creates an AWS-managed organization with buyerId and returns to linked state', async () => {
    const user = userEvent.setup()
    let createRequest: unknown

    mockAwsEndpoints({
      organizations: [],
      onboardingInfo: createOnboardingInfo({ organizations: [] }),
    })
    mswServer.use(
      http.post(`${API_URL}/platform/organizations/cloud-marketplace`, async ({ request }) => {
        createRequest = await request.json()
        return HttpResponse.json(
          createMockOrganizationResponse({
            id: 3,
            name: 'Mock Marketplace Org',
            slug: 'mock-marketplace-org',
            billing_partner: 'aws_marketplace',
          })
        )
      })
    )

    renderScreen()

    await user.click(await screen.findByRole('button', { name: 'Create organization' }))
    await user.type(screen.getByPlaceholderText('Organization name'), 'Mock Marketplace Org')
    fireEvent.submit(document.getElementById(CREATE_AWS_MANAGED_ORG_FORM_ID)!)

    await waitFor(() => {
      expect(createRequest).toEqual({
        name: 'Mock Marketplace Org',
        kind: 'PERSONAL',
        buyer_id: 'buyer-test',
      })
    })
    expect(await screen.findByText('Organization linked')).toBeInTheDocument()
  })

  test('renders setup unavailable when the buyer ID is missing', async () => {
    renderScreen({ buyerId: undefined })

    expect(await screen.findByText('Setup unavailable')).toBeInTheDocument()
    expect(screen.getByText('buyer_id')).toBeInTheDocument()
  })

  test('renders an error state when onboarding info fails to load', async () => {
    mockAwsEndpoints()
    mswServer.use(
      http.get(`${API_URL}/platform/cloud-marketplace/buyers/:buyer_id/onboarding-info`, () =>
        HttpResponse.json({ message: 'Failed to load onboarding info' }, { status: 500 })
      )
    )

    renderScreen()

    expect(await screen.findByText('Unable to load setup')).toBeInTheDocument()
  })

  test('renders the generic ineligible state', async () => {
    mockAwsEndpoints({
      eligibility: {
        eligibility: {
          is_eligible: false,
          reasons: [],
          aws_agreement_id: 'agreement-test',
        },
      },
    })

    renderScreen()

    expect(
      await screen.findByText('This AWS Marketplace subscription cannot be linked right now')
    ).toBeInTheDocument()
    expect(screen.getByText('If the problem persists, contact support.')).toBeInTheDocument()
  })

  test('renders the already-linked ineligible state', async () => {
    mockAwsEndpoints({
      eligibility: {
        eligibility: {
          is_eligible: false,
          reasons: ['AGREEMENT_BASED_OFFER'],
          aws_agreement_id: 'agreement-test',
        },
      },
    })

    renderScreen()

    expect(await screen.findByText('No action required')).toBeInTheDocument()
  })

  test('promotes the last visited organization into the first visible organizations', async () => {
    const organizations = [
      createMockOrganizationResponse({ id: 1, name: 'Alpha Team', slug: 'alpha-team' }),
      createMockOrganizationResponse({ id: 2, name: 'Beta Team', slug: 'beta-team' }),
      createMockOrganizationResponse({ id: 3, name: 'Delta Team', slug: 'delta-team' }),
      createMockOrganizationResponse({ id: 4, name: 'Gamma Team', slug: 'gamma-team' }),
      createMockOrganizationResponse({ id: 5, name: 'Zeta Team', slug: 'zeta-team' }),
    ]

    window.localStorage.setItem(
      LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
      JSON.stringify('zeta-team')
    )
    mockAwsEndpoints({
      organizations,
      onboardingInfo: createOnboardingInfo({
        organizations,
        eligibleSlugs: organizations.map(({ slug }) => slug),
      }),
    })
    renderScreen()

    const zeta = await screen.findByText('Zeta Team')
    const alpha = await screen.findByText('Alpha Team')
    expect(zeta.compareDocumentPosition(alpha) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Show 2 more' })).toBeInTheDocument()
  })

  test('renders a create organization action when there are no existing organizations', async () => {
    mockAwsEndpoints({
      organizations: [],
      onboardingInfo: createOnboardingInfo({ organizations: [] }),
    })

    renderScreen()

    expect(await screen.findByRole('button', { name: 'Create organization' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Create new organization/ })
    ).not.toBeInTheDocument()
  })
})
