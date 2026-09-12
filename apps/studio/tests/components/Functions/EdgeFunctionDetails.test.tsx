import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

// `EdgeFunctionDetails` only renders the verify_jwt section on platform, and reads the function
// slug off the route, so both are pinned here rather than relying on the global `common` mock.
vi.mock('common', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return {
    ...actual,
    IS_PLATFORM: true,
    useParams: () => ({ ref: 'default', functionSlug: 'my-function' }),
  }
})

const { EdgeFunctionDetails } =
  await import('@/components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionDetails')
const { customRender } = await import('@/tests/lib/custom-render')
const { addAPIMock, mswServer } = await import('@/tests/lib/msw')
const { createMockProfile, createMockProfileContext } = await import('@/tests/lib/profile-helpers')
const { API_URL } = await import('@/lib/constants')

const LEGACY_JWT_KEYS = 'project_settings:legacy_jwt_keys'

const renderDetails = ({
  verifyJwt,
  isLegacyJwtEnabled,
}: {
  verifyJwt: boolean
  isLegacyJwtEnabled: boolean
}) => {
  // Surrounding data the page pulls in but none of these assertions depend on.
  mswServer.use(
    http.get(`${API_URL}/enabled-features-overrides`, () =>
      HttpResponse.json({ disabled_features: [] })
    ),
    http.get(`${API_URL}/platform/projects/default`, () => HttpResponse.json({ ref: 'default' })),
    http.get(`${API_URL}/platform/projects/default/settings`, () => HttpResponse.json({})),
    http.get(`${API_URL}/v1/projects/default/api-keys`, () => HttpResponse.json([]))
  )

  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/functions/:function_slug',
    response: {
      id: 'fn-1',
      slug: 'my-function',
      name: 'my-function',
      status: 'ACTIVE',
      version: 1,
      created_at: 0,
      updated_at: 0,
      verify_jwt: verifyJwt,
    },
  })

  return customRender(<EdgeFunctionDetails />, {
    profileContext: createMockProfileContext({
      profile: createMockProfile({
        disabled_features: isLegacyJwtEnabled ? [] : [LEGACY_JWT_KEYS],
      }),
    }),
  })
}

const getSwitch = () => screen.getByRole('switch')

describe('EdgeFunctionDetails verify_jwt toggle', () => {
  test('leaves the toggle usable when legacy JWT keys are enabled', async () => {
    renderDetails({ verifyJwt: false, isLegacyJwtEnabled: true })

    await waitFor(() => expect(getSwitch()).toBeEnabled())
    expect(screen.queryByText(/rejects every request/i)).not.toBeInTheDocument()
  })

  test('disables the toggle when legacy JWT keys are disabled and the gate is off', async () => {
    renderDetails({ verifyJwt: false, isLegacyJwtEnabled: false })

    await waitFor(() => expect(getSwitch()).toBeDisabled())
    expect(screen.getByText(/Unavailable while legacy JWT keys are disabled/i)).toBeInTheDocument()
    expect(screen.queryByText(/rejects every request/i)).not.toBeInTheDocument()
  })

  test('keeps an already enforced gate toggleable and warns that the function is unreachable', async () => {
    renderDetails({ verifyJwt: true, isLegacyJwtEnabled: false })

    await waitFor(() => expect(getSwitch()).toBeEnabled())
    expect(screen.getByText(/rejects every request/i)).toBeInTheDocument()
  })
})
