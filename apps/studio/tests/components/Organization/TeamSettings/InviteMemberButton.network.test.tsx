import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { InviteMemberButton } from '@/components/interfaces/Organization/TeamSettings/InviteMemberButton'
import type { ProfileContextType } from '@/lib/profile'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type OrganizationResponse = components['schemas']['OrganizationResponse']
type Member = components['schemas']['Member']
type InvitationResponse = components['schemas']['InvitationResponse']
type OrganizationRoleResponse = components['schemas']['OrganizationRoleResponse']
type ListEntitlementsResponse = components['schemas']['ListEntitlementsResponse']
type CreateInvitationResponse = components['schemas']['CreateInvitationResponse']
type AccessControlPermission = components['schemas']['AccessControlPermission']

const ORG_SLUG = 'test-org'

const ROLE_IDS = { owner: 1, administrator: 2, developer: 3, readOnly: 4 } as const

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

const buildMember = (overrides: Partial<Member>): Member => ({
  gotrue_id: 'gotrue-test',
  is_sso_user: false,
  metadata: {},
  mfa_enabled: false,
  primary_email: 'me@example.com',
  role_ids: [ROLE_IDS.developer],
  username: 'testuser',
  ...overrides,
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

function setupMocks(members: Member[] = [buildMember({})]) {
  const invitePayloads: unknown[] = []

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
      HttpResponse.json<AccessControlPermission[]>([
        buildPermission('user_invites'),
        buildPermission('auth.subject_roles'),
      ]),
  })

  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/members',
    response: () => HttpResponse.json<Member[]>(members),
  })

  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/members/invitations',
    response: () => HttpResponse.json<InvitationResponse>({ invitations: [] }),
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
        // Unused by this component's org-scoped flow, but required by the schema
        project_scoped_roles: [],
      }),
  })

  // 404 with this message is how the query layer detects "no SSO provider" and
  // resolves the config to null (see getOrgSSOConfig).
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/sso',
    response: () =>
      HttpResponse.json<APIErrorBody>(
        { message: 'Failed to find an existing SSO Provider' },
        { status: 404 }
      ),
  })

  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/entitlements',
    response: () => HttpResponse.json<ListEntitlementsResponse>({ entitlements: [] }),
  })

  addAPIMock({
    method: 'post',
    path: '/platform/organizations/:slug/members/invitations',
    response: async ({ request }) => {
      invitePayloads.push(await request.json())
      return HttpResponse.json<CreateInvitationResponse>({
        succeeded: ['new@example.com'],
        failed: [],
      })
    },
  })

  return { invitePayloads }
}

async function openDialog() {
  await waitFor(() => expect(screen.getByRole('button', { name: /invite members/i })).toBeEnabled())
  await userEvent.click(screen.getByRole('button', { name: /invite members/i }))
  return screen.findByRole('dialog')
}

describe('InviteMemberButton (network)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders each role with its permission description and a roles docs link', async () => {
    setupMocks()
    customRender(<InviteMemberButton />, { profileContext: PROFILE_CONTEXT })
    await openDialog()

    // Every role is rendered as a selectable card
    expect(await screen.findByText('Administrator')).toBeInTheDocument()
    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('Developer')).toBeInTheDocument()
    expect(screen.getByText('Read-only')).toBeInTheDocument()

    // The key safety message from the ticket: Administrator can delete projects
    expect(screen.getByText(/including deleting projects/i)).toBeInTheDocument()

    // Roles documentation is one click away (the ticket's other complaint)
    const docsLink = screen.getByRole('link', { name: /roles and permissions/i })
    expect(docsLink).toHaveAttribute(
      'href',
      expect.stringContaining('/guides/platform/access-control')
    )
  })

  test('sends emails and the default Developer role_id in the request body', async () => {
    const { invitePayloads } = setupMocks()
    customRender(<InviteMemberButton />, { profileContext: PROFILE_CONTEXT })
    await openDialog()
    await screen.findByText('Developer')

    fireEvent.change(screen.getByPlaceholderText(/name@example\.com/i), {
      target: { value: 'new@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send invitation/i }))

    await waitFor(() => expect(invitePayloads).toHaveLength(1))
    expect(invitePayloads[0]).toEqual({
      emails: ['new@example.com'],
      role_id: ROLE_IDS.developer,
    })
  })

  test('sends the selected role_id when a different role is chosen', async () => {
    const { invitePayloads } = setupMocks()
    customRender(<InviteMemberButton />, { profileContext: PROFILE_CONTEXT })
    await openDialog()

    // Select the Administrator card via the new RadioGroupStacked
    await userEvent.click(await screen.findByText('Administrator'))

    fireEvent.change(screen.getByPlaceholderText(/name@example\.com/i), {
      target: { value: 'admin@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send invitation/i }))

    await waitFor(() => expect(invitePayloads).toHaveLength(1))
    expect(invitePayloads[0]).toEqual({
      emails: ['admin@example.com'],
      role_id: ROLE_IDS.administrator,
    })
  })

  test('lowercases and de-duplicates emails before sending', async () => {
    const { invitePayloads } = setupMocks()
    customRender(<InviteMemberButton />, { profileContext: PROFILE_CONTEXT })
    await openDialog()
    await screen.findByText('Developer')

    fireEvent.change(screen.getByPlaceholderText(/name@example\.com/i), {
      target: { value: 'New@Example.COM, new@example.com, second@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send invitation/i }))

    await waitFor(() => expect(invitePayloads).toHaveLength(1))
    expect(invitePayloads[0]).toEqual({
      emails: ['new@example.com', 'second@example.com'],
      role_id: ROLE_IDS.developer,
    })
  })
})
