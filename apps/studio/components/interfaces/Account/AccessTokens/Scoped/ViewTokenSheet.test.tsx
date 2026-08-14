import { fireEvent, screen } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  MOCK_ORG,
  MOCK_PROJECT,
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

    // Bound org resolves with its name, meaning evaluation completed without warnings.
    expect(await screen.findByText(MOCK_ORG.name)).toBeInTheDocument()
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

  test('renders capability cards with attributed endpoints, MCP tools, and a risk banner', async () => {
    mockPermissionsApi(ownerRows(MOCK_ORG.slug))
    mockToken({
      ...TOKEN_BASE,
      scope: 'project',
      project_refs: [MOCK_PROJECT.ref],
      permissions: ['advisors_read', 'database_read', 'database_write'],
    })
    addAPIMock({
      method: 'get',
      // @ts-expect-error Studio API is missing from types
      path: '/scoped-access-token-permissions',
      response: () =>
        HttpResponse.json({
          scopes: {},
          endpoints: {
            'GET /v1/projects/{ref}/advisors/security': [['advisors_read']],
            'GET /v1/projects/{ref}/database': [['database_read']],
            'POST /v1/projects/{ref}/database/query': [['database_write']],
          },
          mcp_tools: {
            get_advisors: [['advisors_read']],
            execute_sql: [['database_write']],
          },
        }),
    })
    renderSheet()

    // Capability cards are closed by default — expand both to see their endpoints and tools.
    expect(await screen.findByText('Advisors')).toBeInTheDocument()
    expect(screen.getByText('Database')).toBeInTheDocument()
    expect(screen.getByText('Read-write')).toBeInTheDocument()
    expect(screen.getByText('Read')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Advisors'))
    fireEvent.click(screen.getByText('Database'))

    // Endpoint rows are copy buttons, so their accessible name carries the method and path.
    expect(
      screen.getByRole('button', { name: 'Copy GET /v1/projects/{ref}/advisors/security' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Copy GET /v1/projects/{ref}/database' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Copy POST /v1/projects/{ref}/database/query' })
    ).toBeInTheDocument()
    // Every method renders as a badge; non-GET methods get the tinted warning variant.
    expect(screen.getByText('POST')).toBeInTheDocument()

    expect(screen.getByText('get_advisors')).toBeInTheDocument()
    expect(screen.getByText('execute_sql')).toBeInTheDocument()

    // project:database is catalog-high risk and granted read-write — max() over capabilities.
    // "High risk" appears twice: the risk banner title, and Database's own Risk Level badge.
    expect(screen.getAllByText('High risk').length).toBe(2)
    expect(
      screen.getByText('Read-write on 1 capability, read on 1, across 1 project.')
    ).toBeInTheDocument()
  })

  test('switches to the dense, filterable view at 9+ granted capabilities', async () => {
    mockPermissionsApi(ownerRows(MOCK_ORG.slug))
    mockToken({
      ...TOKEN_BASE,
      scope: 'project',
      project_refs: [MOCK_PROJECT.ref],
      permissions: [
        'advisors_read',
        'database_read',
        'database_write',
        'backups_read',
        'custom_domain_read',
        'edge_functions_read',
        'storage_read',
        'realtime_config_read',
        'vanity_subdomain_read',
        'infra_add_ons_read',
      ],
    })
    renderSheet()

    expect(await screen.findByText('Database')).toBeInTheDocument()
    expect(screen.getByText(/Not granted · \d+/)).toBeInTheDocument()
    // All granted capabilities render immediately — no truncation.
    expect(screen.getByText('Storage')).toBeInTheDocument()
    expect(screen.getByText('Backups')).toBeInTheDocument()

    // The All/Read/Read-write toggle sits next to the "Capabilities" title, not a text filter.
    fireEvent.click(screen.getByRole('button', { name: 'Read-write' }))
    expect(screen.getByText('Database')).toBeInTheDocument()
    expect(screen.queryByText('Backups')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Read' }))
    expect(screen.queryByText('Database')).toBeNull()
    expect(screen.getByText('Backups')).toBeInTheDocument()
  })
})
