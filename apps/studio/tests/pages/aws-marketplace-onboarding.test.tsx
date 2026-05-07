import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  AwsMarketplaceOnboardingScreen,
  type AwsMarketplaceMockState,
} from '@/pages/aws-marketplace-onboarding'
import type {
  CloudMarketplaceContractLinkingEligibility,
  CloudMarketplaceOnboardingInfo,
} from '@/components/interfaces/Organization/CloudMarketplace/cloud-marketplace-query'
import { API_URL } from '@/lib/constants'
import type { ProfileContextType } from '@/lib/profile'
import { createMockOrganization } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer } from '@/tests/lib/msw'
import type { Organization } from '@/types'

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

const LINKABLE_ORG = createMockOrganization({
  id: 1,
  name: 'Acme Production',
  slug: 'acme-production',
  plan: { id: 'pro', name: 'Pro' },
})
const UNAVAILABLE_ORG = createMockOrganization({
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

function createOnboardingInfo(
  organizations: Organization[] = [LINKABLE_ORG, UNAVAILABLE_ORG]
): CloudMarketplaceOnboardingInfo {
  return {
    aws_contract_auto_renewal: true,
    aws_contract_end_date: '2026-12-31T00:00:00.000Z',
    aws_contract_is_private_offer: false,
    aws_contract_settings_url: 'https://aws.amazon.com/marketplace',
    aws_contract_start_date: '2026-01-01T00:00:00.000Z',
    organization_linking_eligibility: organizations.map((organization) => ({
      slug: organization.slug,
      is_eligible: organization.slug === LINKABLE_ORG.slug,
      reasons: organization.slug === LINKABLE_ORG.slug ? [] : ['ALREADY_MANAGED_BY_PARTNER_AWS'],
    })),
    plan_name_selected_on_marketplace: 'Team',
  }
}

function mockAwsEndpoints({
  organizations = [LINKABLE_ORG, UNAVAILABLE_ORG],
  eligibility = ELIGIBLE_CONTRACT,
  onboardingInfo = createOnboardingInfo(organizations),
}: {
  organizations?: Organization[]
  eligibility?: CloudMarketplaceContractLinkingEligibility
  onboardingInfo?: CloudMarketplaceOnboardingInfo
} = {}) {
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: () => HttpResponse.json(organizations),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/cloud-marketplace/buyers/:buyer_id/contract-linking-eligibility',
    response: () => HttpResponse.json(eligibility),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/cloud-marketplace/buyers/:buyer_id/onboarding-info',
    response: () => HttpResponse.json(onboardingInfo),
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
      http.put(`${API_URL}/platform/organizations/:slug/cloud-marketplace/link`, async ({
        params,
        request,
      }) => {
        linkRequest = {
          slug: String(params.slug),
          body: await request.json(),
        }
        return HttpResponse.json({})
      })
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

  test.each([
    ['invalid', 'Setup unavailable'],
    ['error', 'Unable to load setup'],
    ['linked', 'Organization linked'],
  ] satisfies Array<[AwsMarketplaceMockState, string]>)(
    'renders %s mock state',
    async (mock, expectedText) => {
      renderScreen({ mock })
      expect(await screen.findByText('Link AWS Marketplace')).toBeInTheDocument()
      expect(await screen.findByText(expectedText)).toBeInTheDocument()
    }
  )
})
