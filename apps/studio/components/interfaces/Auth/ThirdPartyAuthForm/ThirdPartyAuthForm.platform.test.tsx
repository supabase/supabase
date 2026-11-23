import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { ThirdPartyAuthForm } from './index'
import { customRender as render } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { mockPermissionsError } from '@/tests/lib/msw-permissions'
import { ALL_FGA_PERMISSIONS, NO_PERMISSIONS } from '@/tests/lib/permissions-fixtures'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return { ...actual, useIsLoggedIn: () => true, useParams: () => ({ ref: 'default' }) }
})

type Integration = components['schemas']['ThirdPartyAuth_Output']

const INTEGRATION: Integration = {
  id: 'tpa-1',
  type: 'oidc',
  oidc_issuer_url: 'https://securetoken.google.com/my-project',
  inserted_at: '2025-02-16T22:24:42.115195Z',
  updated_at: '2025-02-16T22:24:42.115195Z',
}

function mockIntegrations(onRequest?: () => void) {
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/config/auth/third-party-auth',
    response: () => {
      onRequest?.()
      return HttpResponse.json<Integration[]>([INTEGRATION])
    },
  })
}

describe('ThirdPartyAuthForm grants', () => {
  it('lists integrations when the read grant is held', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockIntegrations()

    render(<ThirdPartyAuthForm />, { profileContext: createMockProfileContext() })

    expect(await screen.findByText(/my-project/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Delete integration' })).toBeEnabled()
  })

  it('shows a no-permission message without requesting integrations when denied', async () => {
    const requests = vi.fn()
    mockProjectGrantContext({ ref: 'default', permissions: NO_PERMISSIONS })
    mockIntegrations(requests)

    render(<ThirdPartyAuthForm />, { profileContext: createMockProfileContext() })

    expect(await screen.findByText(/need additional permissions to view/)).toBeVisible()
    expect(requests).not.toHaveBeenCalled()
  })

  it('disables deletion when only the read permission is held', async () => {
    mockProjectGrantContext({
      ref: 'default',
      permissions: {
        organizations: [
          {
            slug: 'acme',
            role: 'owner',
            permissions: ALL_FGA_PERMISSIONS.filter((p) => p !== 'auth_config_write'),
            projects: [],
          },
        ],
      },
    })
    mockIntegrations()

    render(<ThirdPartyAuthForm />, { profileContext: createMockProfileContext() })

    expect(await screen.findByText(/my-project/)).toBeVisible()
    // ButtonTooltip keeps the button focusable, so it is aria-disabled rather than disabled
    const deleteButton = screen.getByRole('button', { name: 'Delete integration' })
    expect(deleteButton).toHaveAttribute('aria-disabled', 'true')

    await userEvent.hover(deleteButton)
    expect(
      await screen.findByRole('tooltip', {
        name: 'You need additional permissions to delete third-party auth integrations',
      })
    ).toBeInTheDocument()
  })

  it('shows an error when permissions fail to load', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockPermissionsError()

    render(<ThirdPartyAuthForm />, { profileContext: createMockProfileContext() })

    expect(
      await screen.findByText(/Failed to check auth provider settings permissions/)
    ).toBeVisible()
  })
})
