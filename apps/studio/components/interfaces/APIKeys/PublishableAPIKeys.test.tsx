import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PublishableAPIKeys } from './PublishableAPIKeys'
import { customRender as render } from '@/tests/lib/custom-render'

const {
  mockIsPlatform,
  mockUseAPIKeysQuery,
  mockUseAsyncCheckPermissions,
  mockUseAPIKeyDeleteMutation,
} = vi.hoisted(() => ({
  mockIsPlatform: { value: true },
  mockUseAPIKeysQuery: vi.fn(),
  mockUseAsyncCheckPermissions: vi.fn(),
  mockUseAPIKeyDeleteMutation: vi.fn(),
}))

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

vi.mock('@/data/api-keys/api-keys-query', () => ({
  useAPIKeysQuery: mockUseAPIKeysQuery,
}))

vi.mock('@/data/api-keys/api-key-delete-mutation', () => ({
  useAPIKeyDeleteMutation: mockUseAPIKeyDeleteMutation,
}))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: mockUseAsyncCheckPermissions,
}))

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

const publishableKey = {
  id: 'pk-1',
  name: 'default-publishable',
  type: 'publishable' as const,
  api_key: 'sb_publishable_xyz',
}

const secretKey = {
  id: 'sk-1',
  name: 'default-secret',
  type: 'secret' as const,
  api_key: 'sb_secret_xyz',
}

describe('PublishableAPIKeys', () => {
  beforeEach(() => {
    mockIsPlatform.value = true
    mockUseAsyncCheckPermissions.mockReturnValue({ can: true, isLoading: false })
    mockUseAPIKeyDeleteMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isSuccess: false,
    })
  })

  it('renders the table with publishable keys', () => {
    mockUseAPIKeysQuery.mockReturnValue({
      data: [publishableKey],
      isPending: false,
      isSuccess: true,
      isError: false,
    })

    render(<PublishableAPIKeys />)

    expect(screen.getByText('api-key-row:default-publishable')).toBeInTheDocument()
    expect(screen.queryByText('No publishable API keys found')).not.toBeInTheDocument()
  })

  it('on platform with secret-only keys, shows the inline "No publishable keys created yet" admonition', () => {
    mockUseAPIKeysQuery.mockReturnValue({
      data: [secretKey],
      isPending: false,
      isSuccess: true,
      isError: false,
    })

    render(<PublishableAPIKeys />)

    expect(screen.getByText('No publishable keys created yet')).toBeInTheDocument()
    expect(screen.queryByText('No publishable API keys found')).not.toBeInTheDocument()
  })

  it('on platform with no keys, does NOT show the self-hosted empty-state card', () => {
    mockUseAPIKeysQuery.mockReturnValue({
      data: [],
      isPending: false,
      isSuccess: true,
      isError: false,
    })

    render(<PublishableAPIKeys />)

    expect(screen.queryByText('No publishable API keys found')).not.toBeInTheDocument()
  })

  it('on self-hosted with no publishable keys, shows the empty-state card', () => {
    mockIsPlatform.value = false
    mockUseAPIKeysQuery.mockReturnValue({
      data: [],
      isPending: false,
      isSuccess: true,
      isError: false,
    })

    render(<PublishableAPIKeys />)

    expect(screen.getByText('No publishable API keys found')).toBeInTheDocument()
  })

  it('hides the create button on non-platform', () => {
    mockIsPlatform.value = false
    mockUseAPIKeysQuery.mockReturnValue({
      data: [publishableKey],
      isPending: false,
      isSuccess: true,
      isError: false,
    })

    render(<PublishableAPIKeys />)

    expect(screen.queryByText('CreatePublishableAPIKeyDialog')).not.toBeInTheDocument()
  })

  it('shows the create button on platform', () => {
    mockUseAPIKeysQuery.mockReturnValue({
      data: [publishableKey],
      isPending: false,
      isSuccess: true,
      isError: false,
    })

    render(<PublishableAPIKeys />)

    expect(screen.getByText('CreatePublishableAPIKeyDialog')).toBeInTheDocument()
  })
})
