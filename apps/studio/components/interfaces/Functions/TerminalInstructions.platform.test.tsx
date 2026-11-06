import { screen, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { TerminalInstructions } from './TerminalInstructions'
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
vi.mock('next/router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

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

type ApiKeyResponse = components['schemas']['ApiKeyResponse_Output']

const apiKeys: ApiKeyResponse[] = [
  { type: 'legacy' as const, name: 'anon', api_key: 'anon-jwt', id: 'anon-id' },
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

const mockEndpointDeps = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/profile/access-tokens',
    response: [],
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
}

const renderInstructions = () => customRender(<TerminalInstructions />, { profileContext })

describe('TerminalInstructions', () => {
  it('requests the keys without a note when api-keys are readable', async () => {
    mockProjectGrantContext({ ref: 'default' })
    const handler = mockApiKeys()
    mockSettings()
    mockEndpointDeps()

    renderInstructions()

    await waitFor(() => expect(handler).toHaveBeenCalled())
    expect(screen.queryByText(/need additional permissions/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Failed to check API key permissions/)).not.toBeInTheDocument()
  })

  it('keeps the placeholder and explains when denied', async () => {
    mockProjectGrantContext({ ref: 'default', permissions: withoutKeysRead() })
    const handler = mockApiKeys()
    mockSettings()
    mockEndpointDeps()

    renderInstructions()

    expect(
      await screen.findByText(/You need additional permissions to view API keys\./)
    ).toBeVisible()
    expect(handler).not.toHaveBeenCalled()
  })

  it('shows an error when permissions fail to load', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockPermissionsError()
    mockSettings()
    mockEndpointDeps()

    renderInstructions()

    expect(await screen.findByText(/Failed to check API key permissions/)).toBeVisible()
  })
})
