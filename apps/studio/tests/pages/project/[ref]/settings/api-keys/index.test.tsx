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

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: mockUseAsyncCheckPermissions,
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

  it('renders the CLI admonition above the keys on self-hosted (CLI mode)', () => {
    mockIsPlatform.value = false
    mockUseDeploymentMode.mockReturnValue({
      isPlatform: false,
      isCli: true,
      isSelfHosted: false,
    })

    render(<ApiKeysPage dehydratedState={{}} />)

    expect(screen.getByText(/Local development with the Supabase CLI/i)).toBeInTheDocument()
    expect(screen.queryByText(/Self-hosted Supabase/i)).not.toBeInTheDocument()
    expect(screen.getByText('PublishableAPIKeys')).toBeInTheDocument()
    expect(screen.getByText('SecretAPIKeys')).toBeInTheDocument()
    expect(screen.queryByText('ApiKeysCreateCallout')).not.toBeInTheDocument()
    expect(screen.queryByText('ApiKeysFeedbackBanner')).not.toBeInTheDocument()
  })

  it('renders the self-hosted admonition above the keys on self-hosted (Docker mode)', () => {
    mockIsPlatform.value = false
    mockUseDeploymentMode.mockReturnValue({
      isPlatform: false,
      isCli: false,
      isSelfHosted: true,
    })

    render(<ApiKeysPage dehydratedState={{}} />)

    expect(screen.getByText(/Self-hosted Supabase/i)).toBeInTheDocument()
    expect(screen.queryByText(/Local development with the Supabase CLI/i)).not.toBeInTheDocument()
    expect(screen.getByText('PublishableAPIKeys')).toBeInTheDocument()
    expect(screen.getByText('SecretAPIKeys')).toBeInTheDocument()
    expect(screen.queryByText('ApiKeysCreateCallout')).not.toBeInTheDocument()
    expect(screen.queryByText('ApiKeysFeedbackBanner')).not.toBeInTheDocument()
  })
})
