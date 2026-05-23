import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ApiKeysPage from '@/pages/project/[ref]/settings/api-keys/index'

const { mockIsPlatform, mockUseAsyncCheckPermissions, mockUseAPIKeysQuery } = vi.hoisted(() => ({
  mockIsPlatform: { value: true },
  mockUseAsyncCheckPermissions: vi.fn(),
  mockUseAPIKeysQuery: vi.fn(),
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
    expect(screen.queryByText(/API keys are configured outside of Studio/i)).not.toBeInTheDocument()
  })

  it('renders the create callout on platform when no new keys exist', () => {
    mockUseAPIKeysQuery.mockReturnValue({ data: [] })

    render(<ApiKeysPage dehydratedState={{}} />)

    expect(screen.getByText('ApiKeysCreateCallout')).toBeInTheDocument()
    expect(screen.queryByText('ApiKeysFeedbackBanner')).not.toBeInTheDocument()
  })

  it('renders the admonition above the keys on self-hosted and hides the callout/banner', () => {
    mockIsPlatform.value = false

    render(<ApiKeysPage dehydratedState={{}} />)

    expect(screen.getByText(/API keys are configured outside of Studio/i)).toBeInTheDocument()
    expect(screen.getByText('PublishableAPIKeys')).toBeInTheDocument()
    expect(screen.getByText('SecretAPIKeys')).toBeInTheDocument()
    expect(screen.queryByText('ApiKeysCreateCallout')).not.toBeInTheDocument()
    expect(screen.queryByText('ApiKeysFeedbackBanner')).not.toBeInTheDocument()
  })
})
