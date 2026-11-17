import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { JWTSecretKeysTable } from './index'
import type { JWTSigningKey } from '@/data/jwt-signing-keys/jwt-signing-keys-query'
import { customRender as render } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import {
  ALL_FGA_PERMISSIONS,
  NO_PERMISSIONS,
  type PermissionsV2Response,
} from '@/tests/lib/permissions-fixtures'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

type LegacyAPIKeysStatus = components['schemas']['LegacyApiKeysResponse_Output']
type SigningKeys = components['schemas']['SigningKeysResponse_Output']

mockAnimationsApi()

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return { ...actual, useIsLoggedIn: () => true, useParams: () => ({ ref: 'default' }) }
})

const LEGACY_KEY: JWTSigningKey = {
  id: 'legacy-key-id',
  algorithm: 'HS256',
  status: 'previously_used',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  public_jwk: null,
}

const IN_USE_KEY: JWTSigningKey = {
  id: 'in-use-key-id',
  algorithm: 'ES256',
  status: 'in_use',
  created_at: '2026-02-01T00:00:00.000Z',
  updated_at: '2026-02-01T00:00:00.000Z',
  public_jwk: null,
}

const withoutPermissions = (denied: string[]): PermissionsV2Response => ({
  organizations: [
    {
      slug: 'acme',
      role: 'owner',
      permissions: ALL_FGA_PERMISSIONS.filter((p) => !denied.includes(p)),
      projects: [],
    },
  ],
})

function mockKeys() {
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/config/auth/signing-keys',
    response: () => HttpResponse.json<SigningKeys>({ keys: [IN_USE_KEY, LEGACY_KEY] }),
  })
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/config/auth/signing-keys/legacy',
    response: () => HttpResponse.json<JWTSigningKey>(LEGACY_KEY),
  })
}

async function openRevokeOnLegacyKey() {
  const user = userEvent.setup()
  const row = (await screen.findByText(LEGACY_KEY.id)).closest('tr')!
  await waitFor(() => expect(row.querySelector('button')).not.toBeDisabled())
  const trigger = Array.from(row.querySelectorAll('button')).pop()!
  await user.click(trigger)
  await user.click(await screen.findByRole('menuitem', { name: /Revoke key/ }))
}

function renderTable() {
  render(<JWTSecretKeysTable />, { profileContext: createMockProfileContext() })
}

describe('JWTSecretKeysTable legacy API keys status', () => {
  it('still renders signing keys when the legacy status grant is denied', async () => {
    mockProjectGrantContext({
      ref: 'default',
      permissions: withoutPermissions(['api_gateway_keys_read']),
    })
    mockKeys()

    renderTable()

    expect(await screen.findByText(IN_USE_KEY.id)).toBeInTheDocument()
    expect(screen.queryByText(/don't have permission to view JWT signing keys/)).toBeNull()
  })

  it('only shows the warning dialog when revoking the legacy key with a denied status grant', async () => {
    mockProjectGrantContext({
      ref: 'default',
      permissions: withoutPermissions(['api_gateway_keys_read']),
    })
    mockKeys()

    renderTable()
    await openRevokeOnLegacyKey()

    expect(
      await screen.findByText(/You don't have permission to check or change that setting/)
    ).toBeInTheDocument()
    expect(screen.queryByText('Yes, revoke this signing key')).toBeNull()
  })

  it('shows the revoke confirmation when legacy API keys are known to be disabled', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockKeys()
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/api-keys/legacy',
      response: () => HttpResponse.json<LegacyAPIKeysStatus>({ enabled: false }),
    })

    renderTable()
    await openRevokeOnLegacyKey()

    expect(await screen.findByText('Yes, revoke this signing key')).toBeInTheDocument()
    expect(screen.queryByText('Disable JWT-based legacy API keys first')).toBeNull()
  })

  it('shows the warning dialog when legacy API keys are enabled', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockKeys()
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/api-keys/legacy',
      response: () => HttpResponse.json<LegacyAPIKeysStatus>({ enabled: true }),
    })

    renderTable()
    await openRevokeOnLegacyKey()

    expect(await screen.findByText('Disable JWT-based legacy API keys first')).toBeInTheDocument()
    expect(screen.queryByText('Yes, revoke this signing key')).toBeNull()
  })
})

describe('JWTSecretKeysTable legacy key request status', () => {
  function mockLegacyKeyFailure(status: number, message: string) {
    mockProjectGrantContext({ ref: 'default' })
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/config/auth/signing-keys',
      response: () => HttpResponse.json<SigningKeys>({ keys: [IN_USE_KEY] }),
    })
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/config/auth/signing-keys/legacy',
      response: () => HttpResponse.json<APIErrorBody>({ message }, { status }),
    })
  }

  it('shows the migrate panel when the legacy secret has not been migrated (404)', async () => {
    mockLegacyKeyFailure(
      404,
      'Legacy JWT secret has not been imported as signing key for this project'
    )

    renderTable()

    expect(await screen.findByRole('button', { name: 'Migrate JWT secret' })).toBeInTheDocument()
  })

  it('shows an error instead of the migrate panel on a server error (500)', async () => {
    mockLegacyKeyFailure(500, 'Boom')

    renderTable()

    expect(
      await screen.findByText('Failed to retrieve legacy JWT secret status')
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Migrate JWT secret' })).toBeNull()
    expect(screen.queryByText(IN_USE_KEY.id)).toBeNull()
  })
})

describe('JWTSecretKeysTable signing keys grant', () => {
  it('shows the permission message when the signing keys grant is denied', async () => {
    mockProjectGrantContext({ ref: 'default', permissions: NO_PERMISSIONS })

    renderTable()

    expect(
      await screen.findByText(/You don't have permission to view JWT signing keys/)
    ).toBeVisible()
  })
})
