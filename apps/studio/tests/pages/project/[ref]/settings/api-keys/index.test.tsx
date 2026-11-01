import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ApiKeysPage from '@/pages/project/[ref]/settings/api-keys/index'

const { mockIsPlatform, mockUseAsyncCheckPermissions, mockUseAPIKeysQuery, mockUseDeploymentMode } =
  vi.hoisted(() => ({
    mockIsPlatform: { value: true },
    mockUseAsyncCheckPermissions: vi.fn(),
    mockUseAPIKeysQuery: vi.fn(),
    mockUseDeploymentMode: vi.fn(),
  }))

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return {
    ...actual,
    get IS_PLATFORM() {
      return mockIsPlatform.value
    },
    useParams: () => ({ ref: 'project-ref' }),
  }
})

vi.mock('@/hooks/misc/useCheckPermissionsV2', () => ({
  useAsyncCheckPermissionsV2: mockUseAsyncCheckPermissions,
  FGA_PERMISSIONS: { PROJECT: { API_GATEWAY_KEYS_READ: 'api_gateway_keys_read' } },
}))

vi.mock('@/data/api-keys/api-keys-query', () => ({
  useAPIKeysQuery: mockUseAPIKeysQuery,
}))

vi.mock('@/hooks/misc/useDeploymentMode', () => ({
  useDeploymentMode: mockUseDeploymentMode,
}))

vi.mock('@/components/layouts/DefaultLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/layouts/ProjectSettingsLayout/SettingsLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/layouts/APIKeys/APIKeysLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/interfaces/APIKeys/ApiKeysIllustrations', () => ({
  ApiKeysCreateCallout: () => <div>ApiKeysCreateCallout</div>,
  ApiKeysFeedbackBanner: () => <div>ApiKeysFeedbackBanner</div>,
}))

vi.mock('@/components/interfaces/APIKeys/PublishableAPIKeys', () => ({
  PublishableAPIKeys: () => <div>PublishableAPIKeys</div>,
}))

vi.mock('@/components/interfaces/APIKeys/SecretAPIKeys', () => ({
  SecretAPIKeys: () => <div>SecretAPIKeys</div>,
}))

vi.mock('@/components/ui/DisableInteraction', () => ({
  DisableInteraction: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

describe('/project/[ref]/settings/api-keys', () => {
  beforeEach(() => {
    mockIsPlatform.value = true
    mockUseAsyncCheckPermissions.mockReturnValue({ can: true, isLoading: false })
    mockUseDeploymentMode.mockReturnValue({
      isPlatform: true,
      isCli: false,
      isSelfHosted: false,
    })
    mockUseAPIKeysQuery.mockReturnValue({
      data: [{ type: 'publishable' }, { type: 'secret' }],
    })
  })

  it('renders publishable and secret keys with the feedback banner on platform when keys exist', () => {
    render(<ApiKeysPage dehydratedState={{}} />)

    expect(screen.getByText('PublishableAPIKeys')).toBeInTheDocument()
    expect(screen.getByText('SecretAPIKeys')).toBeInTheDocument()
    expect(screen.getByText('ApiKeysFeedbackBanner')).toBeInTheDocument()
    expect(screen.queryByText('ApiKeysCreateCallout')).not.toBeInTheDocument()
    expect(screen.queryByText(/Local development with the Supabase CLI/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Self-hosted Supabase/i)).not.toBeInTheDocument()
  })

  it('renders the create callout on platform when no new keys exist', () => {
    mockUseAPIKeysQuery.mockReturnValue({ data: [] })

    render(<ApiKeysPage dehydratedState={{}} />)

    expect(screen.getByText('ApiKeysCreateCallout')).toBeInTheDocument()
    expect(screen.queryByText('ApiKeysFeedbackBanner')).not.toBeInTheDocument()
  })

  it.each([
    {
      mode: 'CLI',
      isCli: true,
      isSelfHosted: false,
      shown: /Local development with the Supabase CLI/i,
      hidden: /Self-hosted Supabase/i,
    },
    {
      mode: 'Docker',
      isCli: false,
      isSelfHosted: true,
      shown: /Self-hosted Supabase/i,
      hidden: /Local development with the Supabase CLI/i,
    },
  ])(
    'renders the matching admonition above the keys on self-hosted ($mode mode)',
    ({ isCli, isSelfHosted, shown, hidden }) => {
      mockIsPlatform.value = false
      mockUseDeploymentMode.mockReturnValue({ isPlatform: false, isCli, isSelfHosted })

      render(<ApiKeysPage dehydratedState={{}} />)

      expect(screen.getByText(shown)).toBeInTheDocument()
      expect(screen.queryByText(hidden)).not.toBeInTheDocument()
      expect(screen.getByText('PublishableAPIKeys')).toBeInTheDocument()
      expect(screen.getByText('SecretAPIKeys')).toBeInTheDocument()
      expect(screen.queryByText('ApiKeysCreateCallout')).not.toBeInTheDocument()
      expect(screen.queryByText('ApiKeysFeedbackBanner')).not.toBeInTheDocument()
    }
  )
})
