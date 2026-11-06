import { screen } from '@testing-library/react'
import type { components } from 'api-types'
import { delay, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ApiKeysPage from '@/pages/project/[ref]/settings/api-keys/index'
import { customRender as render } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ApiKeyResponse = components['schemas']['ApiKeyResponse_Output']

const { mockIsPlatform, mockUseDeploymentMode } = vi.hoisted(() => ({
  mockIsPlatform: { value: true },
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
}))

vi.mock('@/components/interfaces/APIKeys/LegacyAPIKeysRetirementNotice', () => ({
  LegacyAPIKeysRetirementNotice: () => <div>LegacyAPIKeysRetirementNotice</div>,
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

const PUBLISHABLE_KEY: ApiKeyResponse = {
  api_key: 'sb_publishable_xyz',
  hash: 'hash',
  id: 'pk-1',
  inserted_at: '2025-02-16T22:24:42.115195Z',
  name: 'default',
  type: 'publishable',
}

const SECRET_KEY: ApiKeyResponse = {
  api_key: 'sb_secret_xyz',
  hash: 'hash',
  id: 'sk-1',
  inserted_at: '2025-02-16T22:24:42.115195Z',
  name: 'default',
  type: 'secret',
}

const mockApiKeys = (keys: ApiKeyResponse[]) =>
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/api-keys',
    response: () => HttpResponse.json<ApiKeyResponse[]>(keys),
  })

describe('/project/[ref]/settings/api-keys', () => {
  beforeEach(() => {
    mockIsPlatform.value = true
    mockUseDeploymentMode.mockReturnValue({
      isPlatform: true,
      isCli: false,
      isSelfHosted: false,
    })
    mockApiKeys([PUBLISHABLE_KEY, SECRET_KEY])
  })

  it('renders publishable and secret keys with the retirement notice on platform when keys exist', async () => {
    render(<ApiKeysPage dehydratedState={{}} />)

    expect(await screen.findByText('PublishableAPIKeys')).toBeInTheDocument()
    expect(screen.getByText('SecretAPIKeys')).toBeInTheDocument()
    expect(screen.getByText('LegacyAPIKeysRetirementNotice')).toBeInTheDocument()
    expect(screen.queryByText('ApiKeysCreateCallout')).not.toBeInTheDocument()
    expect(screen.queryByText(/Local development with the Supabase CLI/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Self-hosted Supabase/i)).not.toBeInTheDocument()
  })

  it('renders the create callout on platform when no new keys exist', async () => {
    mockApiKeys([])

    render(<ApiKeysPage dehydratedState={{}} />)

    expect(await screen.findByText('ApiKeysCreateCallout')).toBeInTheDocument()
    expect(screen.getByText('LegacyAPIKeysRetirementNotice')).toBeInTheDocument()
  })

  it('does not render the create callout while keys are loading', () => {
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/api-keys',
      response: async () => {
        await delay('infinite')
        return HttpResponse.json<ApiKeyResponse[]>([])
      },
    })

    render(<ApiKeysPage dehydratedState={{}} />)

    expect(screen.queryByText('ApiKeysCreateCallout')).not.toBeInTheDocument()
    expect(screen.getByText('LegacyAPIKeysRetirementNotice')).toBeInTheDocument()
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
      expect(screen.queryByText('LegacyAPIKeysRetirementNotice')).not.toBeInTheDocument()
    }
  )
})
