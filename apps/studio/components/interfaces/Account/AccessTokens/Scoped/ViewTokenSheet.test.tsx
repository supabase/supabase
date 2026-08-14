import { screen } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  MOCK_ORG,
  mockPermissionsApi,
  mockScopedTokenEnvironment,
  ownerRows,
  readonlyRows,
} from '../AccessToken.fixtures'
import { ViewTokenSheet } from './ViewTokenSheet'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'

type TokenResponse = components['schemas']['GetScopedAccessTokenResponse']

mockAnimationsApi()

// The role evaluation reads /platform/profile/permissions, which only fires on the platform for a
// logged-in user — neither is true in the default test environment.
vi.mock('common', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('common')
  return { ...actual, useIsLoggedIn: () => true }
})

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, IS_PLATFORM: true }
})

const TOKEN_BASE = {
  created_at: '2026-08-01T00:00:00.000Z',
  expires_at: null,
  id: 'token-1',
  last_used_at: null,
  name: 'CI token',
  token_alias: 'sbp_test123',
} satisfies Partial<TokenResponse>

const mockToken = (token: TokenResponse) =>
  addAPIMock({
    method: 'get',
    path: '/platform/profile/scoped-access-tokens/:id',
    response: () => HttpResponse.json<TokenResponse>(token),
  })

describe('ViewTokenSheet', () => {
  beforeEach(() => {
    mockScopedTokenEnvironment()
  })

  const renderSheet = () =>
    customRender(<ViewTokenSheet visible tokenId="token-1" onClose={() => {}} />, {
      profileContext: createMockProfileContext(),
    })

  test('shows no access warnings when the role covers every permission', async () => {
    mockPermissionsApi(ownerRows(MOCK_ORG.slug))
    mockToken({
      ...TOKEN_BASE,
      scope: 'organization',
      organization_slugs: [MOCK_ORG.slug],
      permissions: ['database_read', 'database_write'],
    })
    renderSheet()

    // Bound org resolves with its name and slug, meaning evaluation completed without warnings.
    expect(await screen.findByText(MOCK_ORG.name)).toBeInTheDocument()
    expect(screen.getByText(MOCK_ORG.slug)).toBeInTheDocument()
    expect(screen.queryByText('Exceeds your role')).toBeNull()
    expect(
      screen.queryByText('Some permissions exceed your current role for the selected resources')
    ).toBeNull()
    expect(screen.queryByText('This token no longer has access')).toBeNull()
    expect(screen.queryByText("This token's resources no longer exist")).toBeNull()
  })

  test('marks permissions above the current role without blocking the rest', async () => {
    mockPermissionsApi(readonlyRows(MOCK_ORG.slug))
    mockToken({
      ...TOKEN_BASE,
      scope: 'organization',
      organization_slugs: [MOCK_ORG.slug],
      // database_write requires Developer; the owner of this token is Read-only.
      permissions: ['database_read', 'database_write'],
    })
    renderSheet()

    expect(
      await screen.findByText(
        'Some permissions exceed your current role for the selected resources'
      )
    ).toBeInTheDocument()
    expect(await screen.findByText('Exceeds your role')).toBeInTheDocument()
    // Advisory only — the other (destructive) states must not fire.
    expect(screen.queryByText('This token no longer has access')).toBeNull()
    expect(screen.queryByText("This token's resources no longer exist")).toBeNull()
  })

  test('reports lost access when the user was removed from every bound resource', async () => {
    mockPermissionsApi(readonlyRows(MOCK_ORG.slug))
    mockToken({
      ...TOKEN_BASE,
      scope: 'organization',
      // Bound to an org the user can no longer see.
      organization_slugs: ['departed-org'],
      permissions: ['members_read'],
    })
    renderSheet()

    expect(await screen.findByText('This token no longer has access')).toBeInTheDocument()
    expect(
      await screen.findByText(/You were removed from the organizations this token is bound to/)
    ).toBeInTheDocument()
    // The lost resource renders as an anonymous count, never its slug.
    expect(await screen.findByText('1 organization')).toBeInTheDocument()
    expect(await screen.findByText('No longer accessible')).toBeInTheDocument()
    expect(screen.queryByText('departed-org')).toBeNull()
    expect(screen.queryByText("This token's resources no longer exist")).toBeNull()
  })

  test('reports deleted resources when a token has no bindings left', async () => {
    mockPermissionsApi(ownerRows(MOCK_ORG.slug))
    mockToken({
      ...TOKEN_BASE,
      scope: 'project',
      // Deleting a project erases the token's binding to it.
      project_refs: [],
      permissions: ['database_read'],
    })
    renderSheet()

    expect(await screen.findByText("This token's resources no longer exist")).toBeInTheDocument()
    expect(
      (await screen.findAllByText(/Every project this token was bound to has been deleted/)).length
    ).toBeGreaterThan(0)
    expect(screen.queryByText('This token no longer has access')).toBeNull()
  })
})
