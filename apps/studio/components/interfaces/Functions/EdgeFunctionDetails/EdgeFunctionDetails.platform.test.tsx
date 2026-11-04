import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { EdgeFunctionDetails } from './EdgeFunctionDetails'
import { apiKeysKeys } from '@/data/api-keys/keys'
import { FGA_PERMISSIONS } from '@/hooks/misc/useCheckPermissionsV2'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { mockPermissionsError } from '@/tests/lib/msw-permissions'
import { ALL_FGA_PERMISSIONS, type PermissionsV2Response } from '@/tests/lib/permissions-fixtures'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return {
    ...actual,
    useIsLoggedIn: () => true,
    useParams: () => ({ ref: 'default', functionSlug: 'hello' }),
  }
})
vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

type ApiKeyResponse = components['schemas']['ApiKeyResponse_Output']
type FunctionResponse = components['schemas']['FunctionSlugResponse_Output']

const profileContext = createMockProfileContext()

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

const apiKeys: ApiKeyResponse[] = [
  {
    type: 'publishable',
    name: 'default',
    api_key: 'sb_publishable_abc',
    id: 'pub-id',
    inserted_at: '2024-01-01',
  },
]

const mockApiKeys = () => {
  const requests = vi.fn()
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/api-keys',
    response: () => {
      requests()
      return HttpResponse.json<ApiKeyResponse[]>(apiKeys)
    },
  })
  return requests
}

const mockFunctionDeps = () => {
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/functions/:function_slug',
    response: {
      id: 'fn-id',
      slug: 'hello',
      name: 'hello',
      status: 'ACTIVE',
      version: 1,
      created_at: 1,
      updated_at: 1,
      verify_jwt: true,
    } satisfies FunctionResponse,
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/billing/addons',
    response: { selected_addons: [], available_addons: [], ref: 'default' },
  })
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/custom-hostname',
    response: {
      status: '1_not_started',
      custom_hostname: '',
      data: {
        errors: [],
        messages: [],
        success: true,
        result: { hostname: 'api.example.com', id: 'hostname-id' },
      },
    },
  })
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
}

describe('EdgeFunctionDetails', () => {
  it('requests the keys without a note when api-keys are readable', async () => {
    mockProjectGrantContext({ ref: 'default' })
    const requests = mockApiKeys()
    mockFunctionDeps()

    customRender(<EdgeFunctionDetails />, { profileContext })

    await vi.waitFor(() => expect(requests).toHaveBeenCalled())
    expect(screen.queryByText(/need additional permissions/)).not.toBeInTheDocument()
  })

  it('explains the missing permission and skips the request when denied', async () => {
    mockProjectGrantContext({ ref: 'default', permissions: withoutKeysRead() })
    const requests = mockApiKeys()
    mockFunctionDeps()

    customRender(<EdgeFunctionDetails />, { profileContext })

    expect(
      await screen.findByText(/You need additional permissions to view API keys\./)
    ).toBeVisible()
    expect(requests).not.toHaveBeenCalled()
  })

  it('does not use cached keys when denied', async () => {
    mockProjectGrantContext({ ref: 'default', permissions: withoutKeysRead() })
    mockApiKeys()
    mockFunctionDeps()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(apiKeysKeys.list('default', false), apiKeys)

    customRender(<EdgeFunctionDetails />, { profileContext, queryClient })

    expect(
      await screen.findByText(/You need additional permissions to view API keys\./)
    ).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Show anon key' }))
    expect(await screen.findByText(/YOUR ANON KEY/)).toBeInTheDocument()
    expect(screen.queryByText(/sb_publishable_abc/)).not.toBeInTheDocument()
  })

  it('shows an error when permissions fail to load', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockPermissionsError()
    mockFunctionDeps()

    customRender(<EdgeFunctionDetails />, { profileContext })

    expect(await screen.findByText(/Failed to check API key permissions/)).toBeVisible()
  })
})
