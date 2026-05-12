import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeatureFlagContext } from 'common'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { ProfileContextType } from '@/lib/profile'
import { RedeemCreditsScreen, type RedeemCreditsMockState } from '@/pages/redeem'
import { createMockOrganization } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

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

const ORGANIZATION = createMockOrganization({
  id: 1,
  name: 'Acme Production',
  slug: 'acme-production',
  plan: { id: 'pro', name: 'Pro' },
})

function renderScreen(props: Partial<Parameters<typeof RedeemCreditsScreen>[0]> = {}) {
  return customRender(
    <FeatureFlagContext.Provider value={{ configcat: {}, posthog: {}, hasLoaded: true }}>
      <RedeemCreditsScreen {...props} />
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

  test.each([
    ['loading', 'shimmering-loader'],
    ['ready', 'Acme Production'],
    ['redeemed', '$500 credits applied'],
    ['already-redeemed', 'Code already redeemed'],
    ['invalid', 'Invalid code'],
    ['wrong-account', 'Wrong account'],
    ['error', 'Unable to load credit redemption'],
  ] satisfies Array<[RedeemCreditsMockState, string]>)(
    'renders %s mock state',
    (mock, expected) => {
      const { container } = renderScreen({ mock })

      if (expected === 'shimmering-loader') {
        expect(container.querySelectorAll('.shimmering-loader').length).toBeGreaterThan(0)
        return
      }

      expect(screen.getAllByText(expected).length).toBeGreaterThan(0)
    }
  )

  test('renders ready state from organizations query and opens redemption for selected organization', async () => {
    const user = userEvent.setup()
    routerMock.setCurrentUrl('/redeem?code=SUPA-CREDIT-123')
    creditRedemptionQueryCode.current = 'SUPA-CREDIT-123'
    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: () => HttpResponse.json([ORGANIZATION]),
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
    const user = userEvent.setup()
    routerMock.setCurrentUrl('/redeem?code=SUPA-CREDIT-123')
    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: () => HttpResponse.json([ORGANIZATION]),
    })

    renderScreen()

    await user.click(await screen.findByRole('button', { name: /Create new organization/ }))

    await waitFor(() => {
      expect(routerMock.pathname).toBe('/new')
    })
    expect(new URLSearchParams(routerMock.asPath.split('?')[1]).get('returnTo')).toBe(
      '/redeem?code=SUPA-CREDIT-123'
    )
  })
})
