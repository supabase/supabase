import { screen } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { ToggleLegacyApiKeysPanel } from './ToggleLegacyApiKeys'
import { customRender as render } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { mockPermissionsError } from '@/tests/lib/msw-permissions'
import {
  ALL_FGA_PERMISSIONS,
  NO_PERMISSIONS,
  type PermissionsV2Response,
} from '@/tests/lib/permissions-fixtures'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return { ...actual, useIsLoggedIn: () => true, useParams: () => ({ ref: 'default' }) }
})

function permissionsWithout(...excluded: string[]): PermissionsV2Response {
  return {
    organizations: [
      {
        slug: 'acme',
        role: 'owner',
        permissions: ALL_FGA_PERMISSIONS.filter((p) => !excluded.includes(p)),
        projects: [],
      },
    ],
  }
}

function mockLegacyEndpoints(onStatusRequest?: () => void) {
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/api-keys/legacy',
    response: () => {
      onStatusRequest?.()
      return HttpResponse.json<{ enabled: boolean }>({ enabled: true })
    },
  })
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/config/auth/signing-keys/legacy',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Not found' }, { status: 404 }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/oauth/apps',
    response: [],
  })
}

describe('ToggleLegacyApiKeysPanel grants', () => {
  it('enables the toggle with the api gateway grants', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockLegacyEndpoints()

    render(<ToggleLegacyApiKeysPanel />, { profileContext: createMockProfileContext() })

    expect(await screen.findByRole('button', { name: 'Disable JWT-based API keys' })).toBeEnabled()
  })

  it('does not request status and shows a message when the read grant is denied', async () => {
    const requests = vi.fn()
    mockProjectGrantContext({ ref: 'default', permissions: NO_PERMISSIONS })
    mockLegacyEndpoints(requests)

    render(<ToggleLegacyApiKeysPanel />, { profileContext: createMockProfileContext() })

    expect(await screen.findByText(/need additional permissions to view/)).toBeVisible()
    expect(requests).not.toHaveBeenCalled()
  })

  it('uses the api gateway permission rather than the signing keys one for the toggle', async () => {
    mockProjectGrantContext({
      ref: 'default',
      permissions: permissionsWithout('api_gateway_keys_write'),
    })
    mockLegacyEndpoints()

    render(<ToggleLegacyApiKeysPanel />, { profileContext: createMockProfileContext() })

    expect(
      await screen.findByRole('button', { name: 'Disable JWT-based API keys' })
    ).toHaveAttribute('aria-disabled', 'true')
  })

  it('still grants the toggle without the signing keys write permission', async () => {
    mockProjectGrantContext({
      ref: 'default',
      permissions: permissionsWithout('auth_signing_keys_write'),
    })
    mockLegacyEndpoints()

    render(<ToggleLegacyApiKeysPanel />, { profileContext: createMockProfileContext() })

    expect(await screen.findByRole('button', { name: 'Disable JWT-based API keys' })).toBeEnabled()
  })

  it('shows an error when permissions fail to load', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockLegacyEndpoints()
    mockPermissionsError()

    render(<ToggleLegacyApiKeysPanel />, { profileContext: createMockProfileContext() })

    expect(await screen.findByText(/Failed to check legacy API keys permissions/)).toBeVisible()
  })
})
