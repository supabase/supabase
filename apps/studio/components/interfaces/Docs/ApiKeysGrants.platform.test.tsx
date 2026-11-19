import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import Authentication from './Authentication'
import { LangSelector } from './LangSelector'
import { permissionKeys } from '@/data/permissions/keys'
import { FGA_PERMISSIONS } from '@/hooks/misc/useCheckPermissionsV2'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { mockPermissionsError } from '@/tests/lib/msw-permissions'
import { ALL_FGA_PERMISSIONS, type PermissionsV2Response } from '@/tests/lib/permissions-fixtures'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return { ...actual, useIsLoggedIn: () => true, useParams: () => ({ ref: 'default' }) }
})

const withoutKeysRead = (): PermissionsV2Response => ({
  organizations: [
    {
      slug: 'acme',
      role: 'developer',
      permissions: ALL_FGA_PERMISSIONS.filter(
        (permission) => permission !== FGA_PERMISSIONS.PROJECT.API_GATEWAY_KEYS_READ
      ),
      projects: [],
    },
  ],
})

const profileContext = createMockProfileContext()

/**
 * Renders and waits for the permissions query to settle. A denied grant renders the same as a
 * loading one, so without this the denied assertions would also pass while the grant is loading.
 */
const renderWithSettledGrants = async (ui: React.ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  customRender(ui, { profileContext, queryClient })
  await vi.waitFor(() =>
    expect(queryClient.getQueryState(permissionKeys.listV2())?.status).not.toBe('pending')
  )
}

type ApiKeyResponse = components['schemas']['ApiKeyResponse_Output']

const apiKeys: ApiKeyResponse[] = [
  {
    type: 'legacy' as const,
    name: 'anon',
    api_key: 'anon-jwt',
    id: 'anon-id',
  },
  {
    type: 'publishable' as const,
    name: 'default',
    api_key: 'sb_publishable_abc',
    id: 'pub-id',
    inserted_at: '2024-01-01',
  },
]

const mockApiKeys = () => {
  const handler = vi.fn()
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/api-keys',
    response: () => {
      handler()
      return HttpResponse.json<ApiKeyResponse[]>(apiKeys)
    },
  })
  return handler
}

const mockSettings = () =>
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/settings',
    response: {
      app_config: {
        endpoint: 'default.supabase.co',
        db_schema: 'public',
        storage_endpoint: 'default.supabase.co',
      },
      cloud_provider: 'AWS',
      db_dns_name: 'db.default.supabase.co',
      db_host: 'db.default.supabase.co',
      db_name: 'postgres',
      db_port: 5432,
      db_user: 'postgres',
      inserted_at: '2026-01-01T00:00:00.000Z',
      name: 'Production',
      ref: 'default',
      region: 'us-east-1',
      ssl_enforced: false,
      status: 'ACTIVE_HEALTHY',
    },
  })

const langSelector = (
  <LangSelector
    selectedLang="bash"
    selectedApiKey={{ name: 'hide', key: 'SUPABASE_KEY' }}
    setSelectedLang={vi.fn()}
    setSelectedApiKey={vi.fn()}
  />
)

const renderLangSelector = () => customRender(langSelector, { profileContext })

describe('LangSelector', () => {
  it('offers the keys when api-keys are readable', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockApiKeys()

    renderLangSelector()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button'))
    expect(await screen.findByText('Publishable keys')).toBeVisible()
  })

  it('hides the key picker and skips the request when denied', async () => {
    mockProjectGrantContext({ ref: 'default', permissions: withoutKeysRead() })
    const handler = mockApiKeys()

    await renderWithSettledGrants(langSelector)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(handler).not.toHaveBeenCalled()
  })

  it('hides the key picker when permissions fail to load', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockPermissionsError()
    const handler = mockApiKeys()

    await renderWithSettledGrants(langSelector)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(handler).not.toHaveBeenCalled()
  })
})

describe('Authentication', () => {
  it('prefills the client key when api-keys are readable', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockApiKeys()
    mockSettings()

    customRender(<Authentication selectedLang="bash" showApiKey="anon" />, { profileContext })

    expect((await screen.findAllByText(/anon-jwt/)).length).toBeGreaterThan(0)
  })

  it('keeps the placeholder key when denied', async () => {
    mockProjectGrantContext({ ref: 'default', permissions: withoutKeysRead() })
    const handler = mockApiKeys()
    mockSettings()

    await renderWithSettledGrants(<Authentication selectedLang="bash" showApiKey="anon" />)

    expect(screen.queryByText(/anon-jwt/)).not.toBeInTheDocument()
    expect(handler).not.toHaveBeenCalled()
  })

  it('keeps the placeholder key when permissions fail to load', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockPermissionsError()
    const handler = mockApiKeys()
    mockSettings()

    await renderWithSettledGrants(<Authentication selectedLang="bash" showApiKey="anon" />)

    expect(screen.queryByText(/anon-jwt/)).not.toBeInTheDocument()
    expect(handler).not.toHaveBeenCalled()
  })
})
