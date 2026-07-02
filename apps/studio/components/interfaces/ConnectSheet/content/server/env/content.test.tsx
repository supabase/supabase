import { fireEvent, screen, waitFor } from '@testing-library/react'
import { components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ServerEnvContent from './content'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ApiKeyResponse = components['schemas']['ApiKeyResponse']
type ProjectSettingsResponse = components['schemas']['ProjectSettingsResponse']

const { mockUseAsyncCheckPermissions } = vi.hoisted(() => ({
  mockUseAsyncCheckPermissions: vi.fn(),
}))
vi.mock('@/hooks/misc/useCheckPermissions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/misc/useCheckPermissions')>()),
  useAsyncCheckPermissions: mockUseAsyncCheckPermissions,
}))

// CopyButton writes via copyToClipboard from 'ui'. Stub just that export
const { mockCopyToClipboard } = vi.hoisted(() => ({ mockCopyToClipboard: vi.fn() }))
vi.mock('ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('ui')>()),
  copyToClipboard: mockCopyToClipboard,
}))

const PROJECT_ENDPOINT = 'default.supabase.co'
const PROJECT_URL = `https://${PROJECT_ENDPOINT}`
const JWKS_URL = `${PROJECT_URL}/auth/v1/.well-known/jwks.json`
const PUBLISHABLE_KEY = 'sb_publishable_abcdefghijklmnop'

// The list endpoint returns the first 15 chars for a secret key; reveal-by-id
// returns the full value.
const SECRET_MASKED = 'sb_secret_abcde'
const SECRET_FULL = 'sb_secret_abcdefghijklmnopqrstuv'

function mockProjectSettings() {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/settings',
    response: () =>
      HttpResponse.json<ProjectSettingsResponse>({
        app_config: {
          db_schema: 'public',
          endpoint: PROJECT_ENDPOINT,
          storage_endpoint: `storage.${PROJECT_ENDPOINT}`,
        },
        cloud_provider: 'AWS',
        db_dns_name: PROJECT_ENDPOINT,
        db_host: PROJECT_ENDPOINT,
        db_ip_addr_config: 'ipv4',
        db_name: 'postgres',
        db_port: 5432,
        db_user: 'postgres',
        inserted_at: '2025-02-16T22:24:42.115195',
        name: 'default',
        ref: 'default',
        region: 'us-east-1',
        ssl_enforced: true,
        status: 'ACTIVE_HEALTHY',
      }),
  })
}

function mockApiKeysList() {
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/api-keys',
    response: () =>
      HttpResponse.json<ApiKeyResponse[]>([
        {
          id: 'pub-id',
          name: 'default',
          type: 'publishable',
          api_key: PUBLISHABLE_KEY,
          prefix: 'sb_publishable_',
        },
        {
          id: 'secret-id',
          name: 'default',
          type: 'secret',
          api_key: SECRET_MASKED,
          prefix: 'sb_secret_',
        },
      ]),
  })
}

function mockRevealSecret() {
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/api-keys/:id',
    response: () =>
      HttpResponse.json<ApiKeyResponse>({
        id: 'secret-id',
        name: 'default',
        type: 'secret',
        api_key: SECRET_FULL,
        prefix: 'sb_secret_',
      }),
  })
}

describe('ServerEnvContent', () => {
  beforeEach(() => {
    mockUseAsyncCheckPermissions.mockReturnValue({ can: true, isLoading: false, isSuccess: true })
    mockCopyToClipboard.mockClear()
  })

  it('renders the project URL, publishable key, JWKS URL, and a masked secret', async () => {
    mockProjectSettings()
    mockApiKeysList()

    customRender(<ServerEnvContent />)

    expect(await screen.findByText(PROJECT_URL)).toBeInTheDocument()
    expect(await screen.findByText(PUBLISHABLE_KEY)).toBeInTheDocument()
    expect(screen.getByText(JWKS_URL)).toBeInTheDocument()

    expect(screen.queryByText(SECRET_FULL)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reveal secret key' })).toBeEnabled()
  })

  it('reveals the full secret key when the reveal button is clicked', async () => {
    mockProjectSettings()
    mockApiKeysList()
    mockRevealSecret()

    customRender(<ServerEnvContent />)

    await screen.findByText(PUBLISHABLE_KEY)
    fireEvent.click(screen.getByRole('button', { name: 'Reveal secret key' }))

    expect(await screen.findByText(SECRET_FULL)).toBeInTheDocument()
  })

  it('copies the full secret key (revealing it on demand)', async () => {
    mockProjectSettings()
    mockApiKeysList()
    mockRevealSecret()

    customRender(<ServerEnvContent />)

    // The copy button is disabled until the api-keys load (secret exists).
    await screen.findByText(PUBLISHABLE_KEY)
    fireEvent.click(screen.getByRole('button', { name: 'Copy secret key' }))

    await waitFor(() => expect(mockCopyToClipboard).toHaveBeenCalledTimes(1))
    await expect(Promise.resolve(mockCopyToClipboard.mock.calls[0][0])).resolves.toBe(SECRET_FULL)
  })

  it('copies the full .env, with the secret revealed, via "Copy all variables"', async () => {
    mockProjectSettings()
    mockApiKeysList()
    mockRevealSecret()

    customRender(<ServerEnvContent />)

    // Wait for keys to load so buildEnv has real values.
    await screen.findByText(PUBLISHABLE_KEY)
    fireEvent.click(screen.getByRole('button', { name: 'Copy all variables' }))

    await waitFor(() => expect(mockCopyToClipboard).toHaveBeenCalledTimes(1))
    const copied = await Promise.resolve(mockCopyToClipboard.mock.calls[0][0])
    expect(copied).toContain(`SUPABASE_URL=${PROJECT_URL}`)
    expect(copied).toContain(`SUPABASE_PUBLISHABLE_KEY=${PUBLISHABLE_KEY}`)
    expect(copied).toContain(`SUPABASE_SECRET_KEY=${SECRET_FULL}`)
    expect(copied).toContain(`SUPABASE_JWKS_URL=${JWKS_URL}`)
  })

  describe('without service_api_keys permission', () => {
    beforeEach(() => {
      mockUseAsyncCheckPermissions.mockReturnValue({
        can: false,
        isLoading: false,
        isSuccess: true,
      })
    })

    it('still shows the public URL/JWKS but gates the keys and disables the secret', async () => {
      mockProjectSettings()

      customRender(<ServerEnvContent />)

      // Public, settings-derived values are still available.
      expect(await screen.findByText(PROJECT_URL)).toBeInTheDocument()
      expect(screen.getByText(JWKS_URL)).toBeInTheDocument()

      // Keys can't be read, so they fall back to placeholders...
      expect(screen.getByText('your-publishable-key')).toBeInTheDocument()
      expect(screen.getByText('your-secret-key')).toBeInTheDocument()

      // ...and the secret's reveal/copy controls are disabled.
      expect(screen.getByRole('button', { name: 'Reveal secret key' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Copy secret key' })).toBeDisabled()
    })
  })
})
