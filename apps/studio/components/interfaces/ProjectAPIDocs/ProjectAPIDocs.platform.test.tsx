import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectAPIDocs } from './ProjectAPIDocs'
import { FGA_PERMISSIONS } from '@/hooks/misc/useCheckPermissionsV2'
import { appState } from '@/state/app-state'
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

const mockAddons = () =>
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/billing/addons',
    response: { selected_addons: [], available_addons: [], ref: 'default' },
  })

const renderDocs = () => customRender(<ProjectAPIDocs />, { profileContext })

describe('ProjectAPIDocs', () => {
  beforeEach(() => {
    appState.setActiveDocsSection(['introduction'])
    appState.setShowProjectApiDocs(true)
  })
  afterEach(() => {
    appState.setShowProjectApiDocs(false)
  })

  it('shows the client key once keys are shown', async () => {
    mockProjectGrantContext({ ref: 'default' })
    const handler = mockApiKeys()
    mockSettings()
    mockAddons()
    const user = userEvent.setup()

    renderDocs()

    const showKeys = await screen.findByRole('button', { name: 'Show keys' })
    await vi.waitFor(() => expect(showKeys).not.toBeAriaDisabled())
    await user.click(showKeys)

    expect(
      (await screen.findAllByDisplayValue(/sb_publishable_abc|anon-jwt/)).length
    ).toBeGreaterThan(0)
    expect(handler).toHaveBeenCalled()
  })

  it('disables "Show keys" with a tooltip and skips the request when denied', async () => {
    mockProjectGrantContext({ ref: 'default', permissions: withoutKeysRead() })
    const handler = mockApiKeys()
    mockSettings()
    mockAddons()
    const user = userEvent.setup()

    renderDocs()

    const showKeys = await screen.findByRole('button', { name: 'Show keys' })
    await user.hover(showKeys)

    expect(
      (await screen.findAllByText('You need additional permissions to view API keys')).length
    ).toBeGreaterThan(0)
    expect(showKeys).toBeAriaDisabled()
    expect(handler).not.toHaveBeenCalled()
  })

  it('disables "Show keys" with a tooltip when permissions fail to load', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockPermissionsError()
    mockSettings()
    mockAddons()
    const user = userEvent.setup()

    renderDocs()

    const showKeys = await screen.findByRole('button', { name: 'Show keys' })
    await user.hover(showKeys)

    expect(
      (await screen.findAllByText('Failed to check API key permissions')).length
    ).toBeGreaterThan(0)
    expect(showKeys).toBeAriaDisabled()
  })
})
