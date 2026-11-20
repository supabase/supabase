import { screen } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PublishableAPIKeys } from './PublishableAPIKeys'
import { customRender as render } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

type ApiKeyResponse = components['schemas']['ApiKeyResponse_Output']

const { mockIsPlatform } = vi.hoisted(() => ({ mockIsPlatform: { value: true } }))

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return {
    ...actual,
    get IS_PLATFORM() {
      return mockIsPlatform.value
    },
    useParams: () => ({ ref: 'default' }),
  }
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

const publishableKey: ApiKeyResponse = {
  id: 'pk-1',
  name: 'default-publishable',
  type: 'publishable',
  api_key: 'sb_publishable_xyz',
  hash: 'hash',
  inserted_at: '2025-02-16T22:24:42.115195Z',
}

const secretKey: ApiKeyResponse = {
  id: 'sk-1',
  name: 'default-secret',
  type: 'secret',
  api_key: 'sb_secret_xyz',
  hash: 'hash',
  inserted_at: '2025-02-16T22:24:42.115195Z',
}

function mockApiKeys(keys: ApiKeyResponse[]) {
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/api-keys',
    response: () => HttpResponse.json<ApiKeyResponse[]>(keys),
  })
}

describe('PublishableAPIKeys', () => {
  beforeEach(() => {
    mockIsPlatform.value = true
    mockProjectGrantContext({ ref: 'default' })
  })

  it('renders the table with publishable keys and the create button on platform', async () => {
    mockApiKeys([publishableKey])

    render(<PublishableAPIKeys />)

    expect(await screen.findByText('api-key-row:default-publishable')).toBeInTheDocument()
    expect(screen.getByText('CreatePublishableAPIKeyDialog')).toBeInTheDocument()
    expect(screen.queryByText('No publishable API keys found')).not.toBeInTheDocument()
  })

  it('on platform with secret-only keys, shows the inline "No publishable keys created yet" admonition', async () => {
    mockApiKeys([secretKey])

    render(<PublishableAPIKeys />)

    expect(await screen.findByText('No publishable keys created yet')).toBeInTheDocument()
    expect(screen.queryByText('No publishable API keys found')).not.toBeInTheDocument()
  })

  it('on platform with no keys, does NOT show the self-hosted empty-state card', async () => {
    mockApiKeys([])

    render(<PublishableAPIKeys />)

    expect(await screen.findByText('Publishable key')).toBeInTheDocument()
    expect(await screen.findByText('Publishable keys can be safely shared publicly')).toBeVisible()
    expect(screen.queryByText('No publishable API keys found')).not.toBeInTheDocument()
  })

  it('on self-hosted with no publishable keys, shows the empty-state card', async () => {
    mockIsPlatform.value = false
    mockApiKeys([])

    render(<PublishableAPIKeys />)

    expect(await screen.findByText('No publishable API keys found')).toBeInTheDocument()
  })

  it('hides the create button on non-platform', async () => {
    mockIsPlatform.value = false
    mockApiKeys([publishableKey])

    render(<PublishableAPIKeys />)

    expect(await screen.findByText('api-key-row:default-publishable')).toBeInTheDocument()
    expect(screen.queryByText('CreatePublishableAPIKeyDialog')).not.toBeInTheDocument()
  })

  it('shows an error when the keys request fails', async () => {
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/api-keys',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'boom' }, { status: 500 }),
    })

    render(<PublishableAPIKeys />)

    expect(await screen.findByText(/Failed to load API keys/)).toBeVisible()
  })
})
