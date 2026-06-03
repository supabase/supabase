import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { FeatureFlagContext } from 'common'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { RedeemCreditsScreen } from './RedeemCredits'
import type { ProfileContextType } from '@/lib/profile'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

type OrganizationResponse = components['schemas']['OrganizationResponse']

const { creditRedemptionProps } = vi.hoisted(() => ({
  creditRedemptionProps: vi.fn(),
}))
const { creditRedemptionQueryCode } = vi.hoisted(() => ({
  creditRedemptionQueryCode: { current: undefined as string | undefined },
}))

vi.mock('@/components/interfaces/Organization/BillingSettings/CreditCodeRedemption', () => {
  return {
    CreditCodeRedemption: (props: { slug?: string }) => {
      creditRedemptionProps({ ...props, queryCode: creditRedemptionQueryCode.current })
      return (
        <div data-testid="credit-redemption">
          Credit redemption for {props.slug} with code {creditRedemptionQueryCode.current}
        </div>
      )
    },
  }
})

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

const ORGANIZATION = createMockOrganizationResponse({
  id: 1,
  name: 'Acme Production',
  slug: 'acme-production',
  plan: { id: 'pro', name: 'Pro' },
})

function renderScreen() {
  return customRender(
    <FeatureFlagContext.Provider value={{ configcat: {}, posthog: {}, hasLoaded: true }}>
      <RedeemCreditsScreen />
    </FeatureFlagContext.Provider>,
    { profileContext: DEFAULT_PROFILE_CONTEXT }
  )
}

describe('RedeemCreditsScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    creditRedemptionQueryCode.current = undefined
    routerMock.setCurrentUrl('/redeem')
  })

  test('renders ready state from organizations query and opens redemption for selected organization', async () => {
    const user = userEvent.setup()
    routerMock.setCurrentUrl('/redeem?code=SUPA-CREDIT-123')
    creditRedemptionQueryCode.current = 'SUPA-CREDIT-123'
    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: () => HttpResponse.json<OrganizationResponse[]>([ORGANIZATION]),
    })

    renderScreen()

    await user.click(await screen.findByRole('button', { name: /Acme Production/ }))
    await user.click(screen.getByRole('button', { name: 'Redeem credits' }))

    expect(await screen.findByTestId('credit-redemption')).toHaveTextContent(
      'Credit redemption for acme-production with code SUPA-CREDIT-123'
    )
    expect(creditRedemptionProps).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'acme-production',
        queryCode: 'SUPA-CREDIT-123',
      })
    )
  })

  test('routes new organization creation back to the current redeem URL', async () => {
    routerMock.setCurrentUrl('/redeem?code=SUPA-CREDIT-123')
    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: () => HttpResponse.json<OrganizationResponse[]>([ORGANIZATION]),
    })

    renderScreen()

    const createOrganizationLink = await screen.findByRole('link', {
      name: /Create new organization/,
    })

    expect(createOrganizationLink).toHaveAttribute(
      'href',
      '/new?returnTo=%2Fredeem%3Fcode%3DSUPA-CREDIT-123&returnToOrgParam=selected_org'
    )
  })

  test('preselects an organization returned from new organization creation', async () => {
    const user = userEvent.setup()
    routerMock.setCurrentUrl('/redeem?code=SUPA-CREDIT-123&selected_org=acme-production')
    creditRedemptionQueryCode.current = 'SUPA-CREDIT-123'
    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: () => HttpResponse.json<OrganizationResponse[]>([ORGANIZATION]),
    })

    renderScreen()

    const redeemButton = await screen.findByRole('button', { name: 'Redeem credits' })

    await waitFor(() => expect(redeemButton).toBeEnabled())
    await user.click(redeemButton)

    expect(await screen.findByTestId('credit-redemption')).toHaveTextContent(
      'Credit redemption for acme-production with code SUPA-CREDIT-123'
    )
  })
})
