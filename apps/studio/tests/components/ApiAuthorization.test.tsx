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
      await screen.findByText('Failed to fetch details for API authorization request')
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
        await screen.findByText('This authorization request has been approved')
        expect(screen.getByText(/organization "My Org"/)).toBeInTheDocument()
      })

      test('shows Unknown when approved organization is not in the user organizations list', async () => {
        mockBothEndpoints(
          createMockAuthResponse({
            approved_at: '2025-01-15T10:00:00Z',
            approved_organization_slug: 'other-org',
          })
        )
        renderScreen()
        await screen.findByText('This authorization request has been approved')
        expect(screen.getByText(/organization "Unknown"/)).toBeInTheDocument()
      })
    })

    describe('main authorization form', () => {
      describe('organizations states', () => {
        test('disables action buttons while organizations are being fetched', async () => {
          mockAuthEndpoint(createMockAuthResponse())
          addAPIMock({
            method: 'get',
            path: '/platform/organizations',
            response: () => new Promise(() => {}),
          })
          renderScreen()
          await screen.findByText('Authorize API access for Test App')
          expect(screen.getByRole('button', { name: 'Decline' })).toBeDisabled()
          expect(screen.getByRole('button', { name: /Authorize Test App/ })).toBeDisabled()
        })

        test('shows error notice, disables decline button, and hides accept button when organizations query fails', async () => {
          mockAuthEndpoint(createMockAuthResponse())
          addAPIMock({
            method: 'get',
            path: '/platform/organizations',
            response: () => HttpResponse.json({ message: 'Server error' }, { status: 500 }),
          })
          renderScreen()
          await screen.findByText('There was an error loading your organizations')
          expect(screen.getByRole('button', { name: 'Decline' })).toBeDisabled()
          expect(
            screen.queryByRole('button', { name: /Authorize Test App/ })
          ).not.toBeInTheDocument()
        })

        test('shows empty state when user has no organizations', async () => {
          mockBothEndpoints(createMockAuthResponse(), [])
          renderScreen()
          await screen.findByText(/Your account isn't associated with any organizations/)
          expect(screen.getByRole('link', { name: 'Create an organization' })).toBeInTheDocument()
          expect(screen.getByRole('button', { name: 'Decline' })).toBeDisabled()
          expect(
            screen.queryByRole('button', { name: /Authorize Test App/ })
          ).not.toBeInTheDocument()
        })

        test('shows not_member notice when organization_slug does not match any user organization', async () => {
          mockBothEndpoints()
          renderScreen({ organization_slug: 'nonexistent-org' })
          await screen.findByText(/Your account is not a member of the pre-selected organization/)
          expect(screen.getByRole('button', { name: 'Decline' })).toBeDisabled()
          expect(screen.getByRole('button', { name: /Authorize Test App/ })).toBeDisabled()
        })
      })

      describe('success state with organization selector', () => {
        test('renders form with organization selector and action buttons', async () => {
          mockBothEndpoints(createMockAuthResponse({ name: 'My OAuth App' }))
          renderScreen()
          await screen.findByText('Authorize API access for My OAuth App')
          expect(screen.getByRole('combobox')).toBeInTheDocument()
          expect(screen.getByRole('button', { name: /Authorize My OAuth App/ })).toBeInTheDocument()
          expect(screen.getByRole('button', { name: 'Decline' })).toBeInTheDocument()
        })

        test('auto-selects the only organization when no organization_slug is provided', async () => {
          mockBothEndpoints()
          renderScreen()
          const combobox = await screen.findByRole('combobox')
          expect(combobox).toHaveTextContent('My Org')
        })

        test('pre-selects organization when organization_slug matches a user organization', async () => {
          mockBothEndpoints(createMockAuthResponse(), [DEFAULT_ORG, SECOND_ORG])
          renderScreen({ organization_slug: 'second-org' })
          const combobox = await screen.findByRole('combobox')
          expect(combobox).toHaveTextContent('Second Org')
          expect(combobox).not.toHaveTextContent('My Org')
          expect(
            screen.getByText('This organization has been pre-selected by Test App.')
          ).toBeInTheDocument()
        })
      })

      describe('MCP client warning', () => {
        test('shows MCP warning when registration_type is dynamic', async () => {
          mockBothEndpoints(createMockAuthResponse({ registration_type: 'dynamic' }))
          renderScreen()
          await screen.findByText('MCP Client Connection')
        })

        test('does not show MCP warning for non-dynamic registration type', async () => {
          mockBothEndpoints()
          renderScreen()
          await screen.findByText('Authorize API access for Test App')
          expect(screen.queryByText('MCP Client Connection')).not.toBeInTheDocument()
        })
      })

      describe('expiration', () => {
        test('shows expiration warning and disables buttons when request has expired', async () => {
          mockBothEndpoints(
            createMockAuthResponse({ expires_at: dayjs().subtract(1, 'hour').toISOString() })
          )
          renderScreen()
          await screen.findByText('This authorization request is expired')
          expect(screen.getByRole('button', { name: 'Decline' })).toBeDisabled()
          expect(screen.getByRole('button', { name: /Authorize Test App/ })).toBeDisabled()
        })

        test('does not show expiration warning when request has not expired', async () => {
          mockBothEndpoints()
          renderScreen()
          await screen.findByText('Authorize API access for Test App')
          expect(
            screen.queryByText('This authorization request is expired')
          ).not.toBeInTheDocument()
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
          await screen.findByRole('button', { name: 'Decline' })
          await user.click(screen.getByRole('button', { name: 'Decline' }))
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
      })
    })
  })
})
