import type { OAuthClient } from '@supabase/supabase-js'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { OAuthAppsList } from './OAuthAppsList'
import type { AuthConfigResponse } from '@/data/auth/auth-config-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer } from '@/tests/lib/msw'

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/constants')>()
  return { ...actual, IS_PLATFORM: true }
})

vi.mock('./LogoPicker', () => ({
  LogoPicker: () => null,
}))

mockAnimationsApi()

const CONFIDENTIAL_APP: OAuthClient = {
  client_id: 'client-conf-1',
  client_name: 'Confidential App',
  client_type: 'confidential',
  token_endpoint_auth_method: 'client_secret_basic',
  registration_type: 'manual',
  redirect_uris: ['https://example.com/callback'],
  grant_types: ['authorization_code', 'refresh_token'],
  response_types: ['code'],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('OAuthAppsList client secret dialog flow', () => {
  beforeEach(() => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: {
        cloud_provider: 'AWS',
        connectionString: 'postgres://localhost',
        db_host: 'db.default.supabase.co',
        high_availability: false,
        id: 1,
        infra_compute_size: 'micro',
        inserted_at: '2026-01-01T00:00:00Z',
        integration_source: null,
        is_branch_enabled: false,
        is_physical_backups_enabled: false,
        name: 'Default Project',
        organization_id: 1,
        ref: 'default',
        region: 'us-east-1',
        restUrl: 'https://default.supabase.co/rest/v1/',
        status: 'ACTIVE_HEALTHY',
        subscription_id: 'sub-1',
        updated_at: '2026-01-01T00:00:00Z',
      },
    })

    addAPIMock({
      method: 'get',
      path: '/platform/auth/:ref/config',
      response: {
        OAUTH_SERVER_ENABLED: true,
      } as AuthConfigResponse,
    })

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/billing/addons',
      response: {
        ref: 'default',
        selected_addons: [],
        available_addons: [],
      },
    })

    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/custom-hostname',
      response: {
        custom_hostname: '',
        data: {
          result: {
            id: '1',
            hostname: '',
            ssl: { status: 'initializing', validation_records: [] },
            ownership_verification: { name: '', type: '', value: '' },
            status: 'initializing',
          },
          success: true,
          errors: [],
          messages: [],
        },
        status: '1_not_started',
      },
    })

    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/settings',
      response: {
        app_config: {
          db_schema: 'public',
          endpoint: 'default.supabase.co',
          storage_endpoint: 'default.supabase.co',
        },
        cloud_provider: 'AWS',
        db_dns_name: 'db.default.supabase.co',
        db_host: 'db.default.supabase.co',
        db_ip_addr_config: 'legacy',
        db_name: 'postgres',
        db_port: 5432,
        db_user: 'postgres',
        inserted_at: '2026-01-01T00:00:00Z',
        jwt_secret: 'jwt-secret',
        name: 'Default Project',
        ref: 'default',
        region: 'us-east-1',
        service_api_keys: [],
        ssl_enforced: true,
        status: 'ACTIVE_HEALTHY',
      },
    })

    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/api-keys/temporary',
      response: { api_key: 'temp-service-key' },
    })

    mswServer.use(
      http.get('https://default.supabase.co/auth/v1/admin/oauth/clients', () =>
        HttpResponse.json({ clients: [CONFIDENTIAL_APP], aud: 'authenticated' })
      )
    )
  })

  test('opens the client secret dialog after creating a confidential app and closes on Done', async () => {
    mswServer.use(
      http.post('https://default.supabase.co/auth/v1/admin/oauth/clients', async () =>
        HttpResponse.json<OAuthClient>({
          ...CONFIDENTIAL_APP,
          client_id: 'new-conf-client-id',
          client_name: 'New Server App',
          client_secret: 'new-conf-client-secret',
        })
      )
    )

    customRender(<OAuthAppsList />)

    await userEvent.click(await screen.findByRole('button', { name: /New OAuth App/i }))
    await userEvent.type(await screen.findByPlaceholderText('My OAuth App'), 'New Server App')
    await userEvent.type(
      screen.getByPlaceholderText('https://example.com/callback'),
      'https://example.com/callback'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Create app' }))

    expect(await screen.findByText('Save your client secret')).toBeInTheDocument()
    expect(screen.getByDisplayValue('new-conf-client-id')).toBeInTheDocument()
    expect(screen.getByDisplayValue('new-conf-client-secret')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Done' }))
    await waitFor(() =>
      expect(screen.queryByText('Save your client secret')).not.toBeInTheDocument()
    )
  })

  test('does not open the client secret dialog after creating a public app', async () => {
    mswServer.use(
      http.post('https://default.supabase.co/auth/v1/admin/oauth/clients', async () =>
        HttpResponse.json<OAuthClient>({
          ...CONFIDENTIAL_APP,
          client_id: 'new-public-client-id',
          client_name: 'New Mobile App',
          client_type: 'public',
          token_endpoint_auth_method: 'none',
          client_secret: undefined,
        })
      )
    )

    customRender(<OAuthAppsList />)

    await userEvent.click(await screen.findByRole('button', { name: /New OAuth App/i }))
    await userEvent.type(await screen.findByPlaceholderText('My OAuth App'), 'New Mobile App')
    await userEvent.type(
      screen.getByPlaceholderText('https://example.com/callback'),
      'https://example.com/callback'
    )
    await userEvent.click(screen.getByRole('switch', { name: /Public Client/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Create app' }))

    await waitFor(() =>
      expect(screen.queryByText('Create a new OAuth app')).not.toBeInTheDocument()
    )
    expect(screen.queryByText('Save your client secret')).not.toBeInTheDocument()
  })

  test('opens the client secret dialog after regenerating a client secret', async () => {
    mswServer.use(
      http.post(
        'https://default.supabase.co/auth/v1/admin/oauth/clients/:clientId/regenerate_secret',
        () =>
          HttpResponse.json<OAuthClient>({
            ...CONFIDENTIAL_APP,
            client_secret: 'regenerated-secret-999',
          })
      )
    )

    customRender(<OAuthAppsList />)

    await userEvent.click(await screen.findByRole('button', { name: 'Confidential App' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Regenerate client secret' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm' }))

    expect(await screen.findByText('Save your client secret')).toBeInTheDocument()
    expect(screen.getByDisplayValue('client-conf-1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('regenerated-secret-999')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Done' }))
    await waitFor(() =>
      expect(screen.queryByText('Save your client secret')).not.toBeInTheDocument()
    )
  })
})
