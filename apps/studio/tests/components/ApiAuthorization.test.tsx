import { OAuthScope } from '@supabase/shared-types/out/constants'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import {
  ApiAuthorizationScreen,
  type ApiAuthorizationScreenProps,
} from '@/components/interfaces/ApiAuthorization/ApiAuthorization'
import type { ApiAuthorizationResponse } from '@/data/api-authorization/api-authorization-query'
import type { ProfileContextType } from '@/lib/profile'
import { createMockOrganization } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import type { Organization } from '@/types'

// --- Fixtures ---

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

function createMockAuthResponse(
  overrides: Partial<ApiAuthorizationResponse> = {}
): ApiAuthorizationResponse {
  return {
    name: 'Test App',
    website: 'https://testapp.com',
    icon: null,
    domain: 'testapp.com',
    scopes: [],
    expires_at: dayjs().add(1, 'hour').toISOString(),
    approved_at: null,
    registration_type: 'static',
    ...overrides,
  }
}

const DEFAULT_ORG = createMockOrganization({ name: 'My Org', slug: 'my-org' })
const SECOND_ORG = createMockOrganization({ id: 2, name: 'Second Org', slug: 'second-org' })

// --- MSW helpers ---

// Both the auth query and the organizations query fire for any valid auth_id render.
// Since MSW is configured with onUnhandledRequest: 'error', both must always be mocked.

function mockAuthEndpoint(authResponse: ApiAuthorizationResponse) {
  addAPIMock({
    method: 'get',
    path: '/platform/oauth/authorizations/:id',
    response: () => HttpResponse.json(authResponse),
  })
}

function mockOrgsEndpoint(orgs: Array<Organization> = [DEFAULT_ORG]) {
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: () => HttpResponse.json(orgs),
  })
}

function mockBothEndpoints(
  authResponse: ApiAuthorizationResponse = createMockAuthResponse(),
  orgs: Array<Organization> = [DEFAULT_ORG]
) {
  mockAuthEndpoint(authResponse)
  mockOrgsEndpoint(orgs)
}

// --- Render helper ---

function renderScreen(props: Partial<ApiAuthorizationScreenProps> = {}) {
  const navigate = vi.fn()
  const result = customRender(
    <ApiAuthorizationScreen
      auth_id="test-auth-id"
      organization_slug={undefined}
      navigate={navigate}
      {...props}
    />,
    { profileContext: DEFAULT_PROFILE_CONTEXT }
  )
  return { ...result, navigate }
}

// --- Tests ---

describe('ApiAuthorizationScreen', () => {
  describe('when auth_id is missing', () => {
    test('renders invalid screen when auth_id is undefined', () => {
      renderScreen({ auth_id: undefined })
      expect(screen.getByText('Missing parameters')).toBeInTheDocument()
      expect(screen.getByText(/auth_id/)).toBeInTheDocument()
    })
  })

  describe('when auth_id is provided', () => {
    test('renders loading screen while authorization data is being fetched', () => {
      mockOrgsEndpoint()
      addAPIMock({
        method: 'get',
        path: '/platform/oauth/authorizations/:id',
        response: () => new Promise(() => {}),
      })
      const { container } = renderScreen()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(container.querySelectorAll('.shimmering-loader').length).toBeGreaterThan(0)
    })

    test('renders error screen when authorization query fails', async () => {
      mockOrgsEndpoint()
      addAPIMock({
        method: 'get',
        path: '/platform/oauth/authorizations/:id',
        response: () => HttpResponse.json({ message: 'Not found' }, { status: 404 }),
      })
      renderScreen()
      await screen.findByText('Unable to load authorization')
    })

    describe('when already approved', () => {
      test('renders approved screen with matching organization name', async () => {
        mockBothEndpoints(
          createMockAuthResponse({
            approved_at: '2025-01-15T10:00:00Z',
            approved_organization_slug: 'my-org',
          })
        )
        renderScreen()
        await screen.findByText('Authorization approved')
        expect(screen.getByText(/access to My Org/)).toBeInTheDocument()
      })

      test('shows Unknown when approved organization is not in the user organizations list', async () => {
        mockBothEndpoints(
          createMockAuthResponse({
            approved_at: '2025-01-15T10:00:00Z',
            approved_organization_slug: 'other-org',
          })
        )
        renderScreen()
        await screen.findByText('Authorization approved')
        expect(screen.getByText(/access to Unknown/)).toBeInTheDocument()
      })
    })

    describe('main authorization form', () => {
      describe('organizations states', () => {
        test('shows only organizations loader while organizations are being fetched', async () => {
          mockAuthEndpoint(createMockAuthResponse())
          addAPIMock({
            method: 'get',
            path: '/platform/organizations',
            response: () => new Promise(() => {}),
          })
          renderScreen()
          await screen.findByText('Authorize API access for Test App')
          expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
          expect(
            screen.queryByRole('button', { name: /Authorize Test App/ })
          ).not.toBeInTheDocument()
          expect(screen.queryByText('Permissions')).not.toBeInTheDocument()
        })

        test('shows only error notice when organizations query fails', async () => {
          mockAuthEndpoint(createMockAuthResponse())
          addAPIMock({
            method: 'get',
            path: '/platform/organizations',
            response: () => HttpResponse.json({ message: 'Server error' }, { status: 500 }),
          })
          renderScreen()
          await screen.findByText('Unable to load organizations')
          expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
          expect(
            screen.queryByRole('button', { name: /Authorize Test App/ })
          ).not.toBeInTheDocument()
          expect(screen.queryByText('Permissions')).not.toBeInTheDocument()
        })

        test('shows only empty state when user has no organizations', async () => {
          mockBothEndpoints(createMockAuthResponse(), [])
          renderScreen()
          await screen.findByText(/Create an organization before authorizing/)
          expect(
            screen.queryByRole('link', { name: 'Create an organization' })
          ).not.toBeInTheDocument()
          expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
          expect(
            screen.queryByRole('button', { name: /Authorize Test App/ })
          ).not.toBeInTheDocument()
          expect(screen.queryByText('Permissions')).not.toBeInTheDocument()
        })

        test('shows only not_member notice when organization_slug does not match any user organization', async () => {
          mockBothEndpoints()
          renderScreen({ organization_slug: 'nonexistent-org' })
          await screen.findByText(/Your account is not a member of the pre-selected organization/)
          expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
          expect(
            screen.queryByRole('button', { name: /Authorize Test App/ })
          ).not.toBeInTheDocument()
          expect(screen.queryByText('Permissions')).not.toBeInTheDocument()
        })
      })

      describe('success state with organization selector', () => {
        test('renders form with organization selector and action buttons', async () => {
          mockBothEndpoints(createMockAuthResponse({ name: 'My OAuth App' }))
          renderScreen()
          await screen.findByText('Authorize API access for My OAuth App')
          expect(
            screen.getByRole('combobox', { name: 'Organization to grant API access to' })
          ).toBeInTheDocument()
          expect(screen.getByRole('button', { name: /Authorize My OAuth App/ })).toBeInTheDocument()
          expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
        })

        test('auto-selects the only organization when no organization_slug is provided', async () => {
          mockBothEndpoints()
          renderScreen()
          await screen.findByRole('combobox', { name: 'Organization to grant API access to' })
          expect(screen.getByText('My Org')).toBeInTheDocument()
        })

        test('pre-selects organization when organization_slug matches a user organization', async () => {
          mockBothEndpoints(createMockAuthResponse(), [DEFAULT_ORG, SECOND_ORG])
          renderScreen({ organization_slug: 'second-org' })
          await screen.findByRole('combobox', { name: 'Organization to grant API access to' })
          expect(screen.getByText('Second Org')).toBeInTheDocument()
          expect(screen.getByText('Pre-selected by Test App')).toBeInTheDocument()
        })
      })

      describe('permissions trust copy', () => {
        test('shows trust context when registration_type is dynamic', async () => {
          mockBothEndpoints(
            createMockAuthResponse({
              registration_type: 'dynamic',
              scopes: [OAuthScope.DATABASE_READ],
            })
          )
          renderScreen()
          await screen.findByText(/Only continue if you trust this app/)
        })

        test('shows trust context for non-dynamic registration type', async () => {
          mockBothEndpoints(createMockAuthResponse({ scopes: [OAuthScope.DATABASE_READ] }))
          renderScreen()
          await screen.findByText('Authorize API access for Test App')
          expect(screen.getByText(/Only continue if you trust this app/)).toBeInTheDocument()
        })
      })

      describe('expiration', () => {
        test('shows expiration warning and disables buttons when request has expired', async () => {
          mockBothEndpoints(
            createMockAuthResponse({ expires_at: dayjs().subtract(1, 'hour').toISOString() })
          )
          renderScreen()
          await screen.findByText('Authorization request expired')
          expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
          expect(
            screen.queryByRole('button', { name: /Authorize Test App/ })
          ).not.toBeInTheDocument()
          expect(
            screen.queryByRole('combobox', { name: 'Organization to grant API access to' })
          ).not.toBeInTheDocument()
        })

        test('does not show expiration warning when request has not expired', async () => {
          mockBothEndpoints()
          renderScreen()
          await screen.findByText('Authorize API access for Test App')
          expect(screen.queryByText('Authorization request expired')).not.toBeInTheDocument()
        })
      })

      describe('approve action', () => {
        test('calls approve endpoint when Authorize button is clicked', async () => {
          const user = userEvent.setup()
          const approveHandler = vi.fn(() =>
            HttpResponse.json({ url: 'https://redirect.example.com' })
          )
          mockBothEndpoints()
          addAPIMock({
            method: 'post',
            path: '/platform/organizations/:slug/oauth/authorizations/:id',
            response: approveHandler,
          })
          renderScreen()
          await screen.findByRole('button', { name: /Authorize Test App/ })
          await user.click(screen.getByRole('button', { name: /Authorize Test App/ }))
          await waitFor(() => expect(approveHandler).toHaveBeenCalled())
        })
      })

      describe('decline action', () => {
        test('navigates to /organizations after declining', async () => {
          const user = userEvent.setup()
          const declineHandler = vi.fn(() => HttpResponse.json({ id: 'test-auth-id' }))
          mockBothEndpoints()
          addAPIMock({
            method: 'delete',
            path: '/platform/organizations/:slug/oauth/authorizations/:id',
            response: declineHandler,
          })
          const { navigate } = renderScreen()
          await screen.findByRole('button', { name: 'Cancel' })
          await user.click(screen.getByRole('button', { name: 'Cancel' }))
          await waitFor(() => expect(declineHandler).toHaveBeenCalled())
          await waitFor(() => expect(navigate).toHaveBeenCalledWith('/organizations'))
        })
      })

      describe('form validation', () => {
        test('shows validation error when Authorize is clicked without selecting an organization', async () => {
          const user = userEvent.setup()
          // Two orgs → no auto-selection, user must pick one manually
          mockBothEndpoints(createMockAuthResponse(), [DEFAULT_ORG, SECOND_ORG])
          renderScreen()
          await screen.findByRole('button', { name: /Authorize Test App/ })
          await user.click(screen.getByRole('button', { name: /Authorize Test App/ }))
          expect(
            (await screen.findAllByText('Please select an organization')).length
          ).toBeGreaterThan(0)
        })

        test('shows validation error in mock mode when Authorize is clicked without selecting an organization', async () => {
          const user = userEvent.setup()
          renderScreen({ mock: 'ready' })

          await screen.findByRole('button', { name: /Authorize Cursor/ })
          await user.click(screen.getByRole('button', { name: /Authorize Cursor/ }))

          expect(
            (await screen.findAllByText('Please select an organization')).length
          ).toBeGreaterThan(0)
        })
      })

      describe('mock organisation dropdown', () => {
        test('shows all mock organizations in the dropdown', async () => {
          const user = userEvent.setup()
          renderScreen({ mock: 'ready' })

          const selector = await screen.findByRole('combobox', {
            name: 'Organization to grant API access to',
          })
          await user.click(selector)

          expect(await screen.findByRole('option', { name: /Northwind Labs/ })).toBeInTheDocument()
        })
      })
    })
  })
})
