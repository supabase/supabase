import { screen } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { PublishableAPIKeys } from './PublishableAPIKeys'
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

vi.mock('./CreatePublishableAPIKeyDialog', () => ({
  CreatePublishableAPIKeyDialog: () => <div>CreatePublishableAPIKeyDialog</div>,
}))

vi.mock('./APIKeyRow', () => ({
  APIKeyRow: ({ apiKey }: { apiKey: { id: string; name: string } }) => (
    <tr>
      <td>api-key-row:{apiKey.name}</td>
    </tr>
  ),
}))

type ApiKeyResponse = components['schemas']['ApiKeyResponse_Output']

const publishableKey: ApiKeyResponse = {
  id: 'pk-1',
  name: 'default-publishable',
  type: 'publishable',
  api_key: 'sb_publishable_xyz',
  hash: 'hash',
  inserted_at: '2025-02-16T22:24:42.115195Z',
}

function mockApiKeys(keys: ApiKeyResponse[], onRequest?: () => void) {
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/api-keys',
    response: () => {
      onRequest?.()
      return HttpResponse.json<ApiKeyResponse[]>(keys)
    },
  })
}

describe('PublishableAPIKeys grants', () => {
  it('grants access with the project permissions', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockApiKeys([publishableKey])

    render(<PublishableAPIKeys />, { profileContext: createMockProfileContext() })

    expect(await screen.findByText('api-key-row:default-publishable')).toBeInTheDocument()
  })

  it('shows a no-permission message without requesting keys when the grant is denied', async () => {
    const requests = vi.fn()
    mockProjectGrantContext({ ref: 'default', permissions: NO_PERMISSIONS })
    mockApiKeys([], requests)

    render(<PublishableAPIKeys />, { profileContext: createMockProfileContext() })

    expect(await screen.findByText(/need additional permissions to view API keys/)).toBeVisible()
    expect(requests).not.toHaveBeenCalled()
  })

  it('denies when only unrelated permissions are held', async () => {
    mockProjectGrantContext({
      ref: 'default',
      permissions: {
        organizations: [
          {
            slug: 'acme',
            role: 'owner',
            permissions: ALL_FGA_PERMISSIONS.filter((p) => !p.startsWith('api_gateway_keys_')),
            projects: [],
          },
        ],
      },
    })
    mockApiKeys([publishableKey])

    render(<PublishableAPIKeys />, { profileContext: createMockProfileContext() })

    expect(await screen.findByText(/need additional permissions to view API keys/)).toBeVisible()
  })

  it('shows an error when permissions fail to load', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockPermissionsError()

    render(<PublishableAPIKeys />, { profileContext: createMockProfileContext() })

    expect(await screen.findByText(/Failed to check API key permissions/)).toBeVisible()
  })
})
