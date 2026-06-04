import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { UpdateRolesPanel } from '@/components/interfaces/Organization/TeamSettings/UpdateRolesPanel/UpdateRolesPanel'
import type { OrganizationMember } from '@/data/organizations/organization-members-query'
import type { ProfileContextType } from '@/lib/profile'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type OrganizationResponse = components['schemas']['OrganizationResponse']
type OrganizationRoleResponse = components['schemas']['OrganizationRoleResponse']
type OrganizationProjectsResponse = components['schemas']['OrganizationProjectsResponse']
type ListEntitlementsResponse = components['schemas']['ListEntitlementsResponse']
type AccessControlPermission = components['schemas']['AccessControlPermission']

const ORG_SLUG = 'test-org'

const ROLE_IDS = { owner: 1, administrator: 2, developer: 3, readOnly: 4 } as const

// Sheet + Select are built on Radix, which relies on the Web Animations API
mockAnimationsApi()
// Radix Select scrolls the active option into view when the dropdown opens
window.HTMLElement.prototype.scrollIntoView = vi.fn()

vi.mock('common', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('common')
  return {
    ...actual,
    useParams: () => ({ slug: ORG_SLUG }),
    useIsLoggedIn: () => true,
  }
})

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, IS_PLATFORM: true }
})

const PROFILE_CONTEXT: ProfileContextType = {
  profile: {
    id: 1,
    auth0_id: 'auth0|test',
    gotrue_id: 'gotrue-test',
    username: 'testuser',
    primary_email: 'me@example.com',
    first_name: null,
    last_name: null,
    mobile: null,
    is_alpha_user: false,
    is_sso_user: false,
    disabled_features: [],
    free_project_limit: null,
  },
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: true,
}

const buildRole = (id: number, name: string): OrganizationRoleResponse['org_scoped_roles'][0] => ({
  id,
  name,
  base_role_id: id,
  description: null,
  projects: [],
})

const buildPermission = (resource: string): AccessControlPermission => ({
  actions: ['write:Create', 'write:Delete'],
  condition: null,
  organization_id: 1,
  organization_slug: ORG_SLUG,
  project_ids: [],
  project_refs: [],
  resources: [resource],
  restrictive: false,
})

const MEMBER: OrganizationMember = {
  gotrue_id: 'gotrue-member',
  is_sso_user: false,
  metadata: {},
  mfa_enabled: false,
  primary_email: 'member@example.com',
  role_ids: [ROLE_IDS.developer],
  username: 'member',
}

function setupMocks() {
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: () =>
      HttpResponse.json<OrganizationResponse[]>([
        createMockOrganizationResponse({ id: 1, slug: ORG_SLUG, name: 'Test Org' }),
      ]),
  })

  addAPIMock({
    method: 'get',
    path: '/platform/profile/permissions',
    response: () =>
      HttpResponse.json<AccessControlPermission[]>([buildPermission('auth.subject_roles')]),
  })

  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/roles',
    response: () =>
      HttpResponse.json<OrganizationRoleResponse>({
        org_scoped_roles: [
          buildRole(ROLE_IDS.owner, 'Owner'),
          buildRole(ROLE_IDS.administrator, 'Administrator'),
          buildRole(ROLE_IDS.developer, 'Developer'),
          buildRole(ROLE_IDS.readOnly, 'Read-only'),
        ],
        project_scoped_roles: [],
      }),
  })

  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/projects',
    response: () =>
      HttpResponse.json<OrganizationProjectsResponse>({
        pagination: { count: 0, limit: 96, offset: 0 },
        projects: [],
      }),
  })

  // Empty entitlements => project-level permissions are off, so the panel
  // renders the org-scoped role flow (a single Select).
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/entitlements',
    response: () => HttpResponse.json<ListEntitlementsResponse>({ entitlements: [] }),
  })
}

describe('UpdateRolesPanel (network)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('shows each role with its permission description and a roles docs link', async () => {
    setupMocks()
    customRender(<UpdateRolesPanel visible member={MEMBER} onClose={vi.fn()} />, {
      profileContext: PROFILE_CONTEXT,
    })

    // The current (Developer) role is reflected in the trigger
    const trigger = await screen.findByRole('combobox')
    expect(trigger).toHaveTextContent('Developer')

    // Roles documentation is one click away (the ticket's other complaint).
    // Asserted before opening the dropdown, which aria-hides the rest of the sheet.
    const docsLink = screen.getByRole('link', { name: /docs/i })
    expect(docsLink).toHaveAttribute(
      'href',
      expect.stringContaining('/guides/platform/access-control')
    )

    // Open the role dropdown to reveal all the options
    await userEvent.click(trigger)

    // Every role is listed as an option
    expect(await screen.findByRole('option', { name: /Owner/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Administrator/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Developer/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Read-only/ })).toBeInTheDocument()

    // The key safety message from the ticket: Administrator can delete projects
    expect(screen.getByText(/including deleting projects/i)).toBeInTheDocument()
  })

  test('renders a role description for every known role', async () => {
    setupMocks()
    customRender(<UpdateRolesPanel visible member={MEMBER} onClose={vi.fn()} />, {
      profileContext: PROFILE_CONTEXT,
    })

    await userEvent.click(await screen.findByRole('combobox'))

    await waitFor(() => {
      expect(screen.getByText(/deleting the organization/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Manage members, billing/i)).toBeInTheDocument()
    expect(screen.getByText(/Manage project content/i)).toBeInTheDocument()
    expect(screen.getByText(/limited to SELECT queries/i)).toBeInTheDocument()
  })
})
