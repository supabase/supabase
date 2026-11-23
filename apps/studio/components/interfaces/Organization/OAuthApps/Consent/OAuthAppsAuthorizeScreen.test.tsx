import { fireEvent, screen, waitFor } from '@testing-library/react'
import { mockIntersectionObserver } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'

import { OAuthAppsAuthorizeScreen } from './OAuthAppsAuthorizeScreen'
import { OAuthAppsAuthorizeApproveData } from '@/data/oauth-apps/oauth-apps-authorize-approve-mutation'
import { OAuthAppsAuthorizeRequestData } from '@/data/oauth-apps/oauth-apps-authorize-request-query'
import { OAuthAppsPreflightValidationData } from '@/data/oauth-apps/oauth-apps-preflight-validation-query'
import { OrgProject, OrgProjectsResponse } from '@/data/projects/org-projects-infinite-query'
import { ProjectDetail } from '@/data/projects/project-detail-query'
import { createMockOrganization } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { Organization } from '@/types'

type RenderScreenOptions = {
  authId?: string
  request?: OAuthAppsAuthorizeRequestData
  organizationSlug?: string
  projectRef?: string
}

function renderScreen({ organizationSlug, projectRef }: RenderScreenOptions = {}) {
  return customRender(
    <OAuthAppsAuthorizeScreen
      authId="authId"
      organizationSlug={organizationSlug}
      projectRef={projectRef}
    />,
    {
      profileContext: createMockProfileContext(),
    }
  )
}

// The authorize button renders disabled while app details are still pending.
// React Query 5.104 settles that query after the button is already in the document.
async function enabledAuthorizeButton(name = /Authorize Vercel/) {
  const button = await screen.findByRole('button', { name })
  await waitFor(() => expect(button).toBeEnabled())
  return button
}

async function toggleProject(projectName: string) {
  // Needed because of a rerender in MultiSelector
  await new Promise((resolve) => setTimeout(resolve, 50))
  fireEvent.click(await screen.findByRole('option', { name: projectName }))
}

async function selectProject(projectName: string) {
  fireEvent.click(await screen.findByRole('combobox', { name: 'Projects' }))
  await toggleProject(projectName)
}

const mockScopes: OAuthAppsAuthorizeRequestData['scopes'] = [
  'database:read',
  'database:write',
  'environment:read',
  'environment:write',
  'secrets:read',
  'projects:read',
  'edge_functions:read',
  'storage:read',
  'analytics:read',
  'analytics:write',
]

const createMockRequest = (
  request?: Partial<OAuthAppsAuthorizeRequestData>
): OAuthAppsAuthorizeRequestData => ({
  allow_partial_grants: false,
  app_id: 'vercel',
  name: 'Vercel',
  website: 'https://vercel.com',
  domain: 'vercel.com',
  redirect_uri: 'https://vercel.com/api/integrations/supabase/callback',
  registration_type: 'manual',
  expires_at: '',
  grant_kind: 'member_bound',
  project_scoping_mode: true,
  scopes: mockScopes,
  ...request,
})

const createMockOrganizationProjects = (projects?: Array<OrgProject>) => ({
  projects: projects ?? [
    createMockOrganizationProject({
      ref: 'northwindstorefront1',
      name: 'northwind-storefront',
    }),
    createMockOrganizationProject({
      ref: 'northwindcms1',
      name: 'northwind-cms',
    }),
  ],
  pagination: {
    count: projects?.length ?? 0,
    limit: 100,
    offset: 0,
  },
})

const createMockOrganizationProject = (project?: Partial<OrgProject>): OrgProject => ({
  cloud_provider: '',
  databases: [],
  inserted_at: '',
  integration_source: null,
  is_branch: false,
  name: '',
  ref: '',
  region: '',
  status: 'ACTIVE_HEALTHY',
  ...project,
})

const createMockProject = (project?: Partial<ProjectDetail>): ProjectDetail => ({
  cloud_provider: '',
  connectionString: '',
  db_host: '',
  high_availability: false,
  id: 1,
  inserted_at: '',
  integration_source: '',
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  ref: 'northwindstorefront1',
  name: 'northwind-storefront',
  organization_id: 1,
  region: '',
  restUrl: '',
  status: 'ACTIVE_HEALTHY',
  subscription_id: '',
  updated_at: '',
  dbVersion: '',
  ...project,
})

const createMockPreflight = (
  response?: Partial<OAuthAppsPreflightValidationData>
): OAuthAppsPreflightValidationData => ({
  existing_grant: response?.existing_grant ?? null,
  validation_failure: response?.validation_failure ?? null,
})

mockIntersectionObserver()

describe('OAuthAppsAuthorizeScreen', () => {
  test('requires at least one selected project before authorizing', async () => {
    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsAuthorizeRequestData>(createMockRequest()),
    })
    addAPIMock({
      path: '/platform/organizations',
      method: 'get',
      response: () =>
        HttpResponse.json<Organization[]>([
          createMockOrganization({
            slug: 'northwind-traders',
          }),
        ]),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/projects',
      method: 'get',
      response: () => HttpResponse.json<OrgProjectsResponse>(createMockOrganizationProjects()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id/preflight',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsPreflightValidationData>(createMockPreflight()),
    })
    renderScreen()

    await screen.findByText('Must select at least one project to authorize.')

    await selectProject('northwind-storefront')
    expect(
      screen.queryByText('Must select at least one project to authorize.')
    ).not.toBeInTheDocument()

    await toggleProject('northwind-storefront')
    expect(screen.getByText('Must select at least one project to authorize.')).toBeInTheDocument()
  })

  test('shows no upfront over-role warning, even for the read-only fixture', async () => {
    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsAuthorizeRequestData>(createMockRequest()),
    })
    addAPIMock({
      path: '/platform/organizations',
      method: 'get',
      response: () =>
        HttpResponse.json<Organization[]>([
          createMockOrganization({
            slug: 'northwind-traders',
          }),
        ]),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/projects',
      method: 'get',
      response: () => HttpResponse.json<OrgProjectsResponse>(createMockOrganizationProjects()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id/preflight',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsPreflightValidationData>(createMockPreflight()),
    })
    renderScreen()

    await screen.findByText('Permissions requested')
    expect(
      screen.queryByText('Some requested permissions exceed your role')
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Read-only for your role')).not.toBeInTheDocument()
  })

  test('renders the empty-org notice, hides permissions, and shows the cancel footer', async () => {
    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsAuthorizeRequestData>(createMockRequest()),
    })
    addAPIMock({
      path: '/platform/organizations',
      method: 'get',
      response: () =>
        HttpResponse.json<Organization[]>([
          createMockOrganization({
            name: 'contoso-labs',
            slug: 'contoso-labs',
          }),
        ]),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/projects',
      method: 'get',
      response: () => HttpResponse.json<OrgProjectsResponse>(createMockOrganizationProjects([])),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id/preflight',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsPreflightValidationData>(createMockPreflight()),
    })
    renderScreen()

    expect(await screen.findByText('No projects in contoso-labs')).toBeInTheDocument()
    // expect(screen.queryByText('Permissions requested')).not.toBeInTheDocument()
    expect(
      screen.getByText(
        'Cancelling will redirect you to https://vercel.com/api/integrations/supabase/callback with access denied.'
      )
    ).toBeInTheDocument()
  })

  test('success screen shows exactly the submitted projects and scopes', async () => {
    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsAuthorizeRequestData>(createMockRequest()),
    })
    addAPIMock({
      path: '/platform/organizations',
      method: 'get',
      response: () =>
        HttpResponse.json<Organization[]>([
          createMockOrganization({
            slug: 'northwind-traders',
          }),
        ]),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/projects',
      method: 'get',
      response: () => HttpResponse.json<OrgProjectsResponse>(createMockOrganizationProjects()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id/preflight',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsPreflightValidationData>(createMockPreflight()),
    })
    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsAuthorizeRequestData>(createMockRequest()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id',
      method: 'post',
      response: () =>
        HttpResponse.json<OAuthAppsAuthorizeApproveData>({
          url: '',
        }),
    })
    renderScreen()

    await selectProject('northwind-cms')
    fireEvent.click(await enabledAuthorizeButton())

    expect(await screen.findByText('Vercel is connected')).toBeInTheDocument()
    expect(screen.getByText('You can return to Vercel to continue')).toBeInTheDocument()

    expect(screen.getByText('northwind-cms')).toBeInTheDocument()
    expect(screen.queryByText('northwind-storefront')).not.toBeInTheDocument()

    expect(screen.getByText('Permissions granted')).toBeInTheDocument()
    expect(screen.queryByText('Permissions requested')).not.toBeInTheDocument()
    expect(screen.getByText('Database, Environment, Analytics')).toBeInTheDocument()
    expect(screen.getByText('Secrets, Projects, Edge Functions, Storage')).toBeInTheDocument()
  })

  test('an organization-bound app reaches the success screen with the authorizing identity', async () => {
    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () =>
        HttpResponse.json<OAuthAppsAuthorizeRequestData>(
          createMockRequest({
            project_scoping_mode: false,
            grant_kind: 'organization_bound',
            scopes: ['projects:read'],
          })
        ),
    })
    addAPIMock({
      path: '/platform/organizations',
      method: 'get',
      response: () =>
        HttpResponse.json<Organization[]>([
          createMockOrganization({
            slug: 'northwind-traders',
          }),
        ]),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/projects',
      method: 'get',
      response: () => HttpResponse.json<OrgProjectsResponse>(createMockOrganizationProjects()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id/preflight',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsPreflightValidationData>(createMockPreflight()),
    })
    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () =>
        HttpResponse.json<OAuthAppsAuthorizeRequestData>(
          createMockRequest({
            allow_partial_grants: false,
            grant_kind: 'organization_bound',
          })
        ),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id',
      method: 'post',
      response: () =>
        HttpResponse.json<OAuthAppsAuthorizeApproveData>({
          url: '',
        }),
    })
    renderScreen()

    await selectProject('northwind-storefront')
    fireEvent.click(await enabledAuthorizeButton(/Authorize Vercel/))

    expect(await screen.findByText('Vercel is connected')).toBeInTheDocument()
    expect(screen.getByText('Authorized by')).toBeInTheDocument()
    expect(screen.getByText(/test@example\.com/)).toBeInTheDocument()
  })

  test('tells the member an organization-bound grant is shared, exactly once, without the member-bound copy', async () => {
    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () =>
        HttpResponse.json<OAuthAppsAuthorizeRequestData>(
          createMockRequest({
            grant_kind: 'organization_bound',
            scopes: ['projects:read'],
          })
        ),
    })
    addAPIMock({
      path: '/platform/organizations',
      method: 'get',
      response: () =>
        HttpResponse.json<Organization[]>([
          createMockOrganization({
            slug: 'northwind-traders',
          }),
        ]),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/projects',
      method: 'get',
      response: () => HttpResponse.json<OrgProjectsResponse>(createMockOrganizationProjects()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id/preflight',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsPreflightValidationData>(createMockPreflight()),
    })
    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () =>
        HttpResponse.json<OAuthAppsAuthorizeRequestData>(
          createMockRequest({
            allow_partial_grants: false,
            grant_kind: 'organization_bound',
          })
        ),
    })
    renderScreen()

    expect(await screen.findAllByText('Want this scoped to one member?')).toHaveLength(1)
    expect(
      screen.getAllByText(
        'Have them authorize Vercel from their own account. Authorizing here gives it your Administrator access on every project, including ones created later.'
      )
    ).toHaveLength(1)
    expect(screen.queryByText(/This grant acts as you/)).not.toBeInTheDocument()
    expect(screen.queryByText(/No admin approval is needed/)).not.toBeInTheDocument()
    expect(
      screen.getByText(/This authorization will appear in Authorized apps/)
    ).toBeInTheDocument()
  })

  test('shows the member-bound copy for a member-bound grant that picks projects', async () => {
    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsAuthorizeRequestData>(createMockRequest()),
    })
    addAPIMock({
      path: '/platform/organizations',
      method: 'get',
      response: () =>
        HttpResponse.json<Organization[]>([
          createMockOrganization({
            slug: 'northwind-traders',
          }),
        ]),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/projects',
      method: 'get',
      response: () => HttpResponse.json<OrgProjectsResponse>(createMockOrganizationProjects()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id/preflight',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsPreflightValidationData>(createMockPreflight()),
    })
    renderScreen()

    expect(
      await screen.findByText(/No admin approval is needed if your role permits this access/)
    ).toBeInTheDocument()
    expect(screen.getByText(/This grant acts as you/)).toBeInTheDocument()
    expect(screen.queryByText('Want this scoped to one member?')).not.toBeInTheDocument()
    expect(screen.queryByText('This grant covers every project')).not.toBeInTheDocument()
  })

  test('authorizes an app that hides the picker, covering future projects', async () => {
    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () =>
        HttpResponse.json<OAuthAppsAuthorizeRequestData>(
          createMockRequest({
            project_scoping_mode: false,
          })
        ),
    })
    addAPIMock({
      path: '/platform/organizations',
      method: 'get',
      response: () =>
        HttpResponse.json<Organization[]>([
          createMockOrganization({
            slug: 'northwind-traders',
          }),
        ]),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/projects',
      method: 'get',
      response: () => HttpResponse.json<OrgProjectsResponse>(createMockOrganizationProjects()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id/preflight',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsPreflightValidationData>(createMockPreflight()),
    })
    renderScreen()

    expect(await screen.findByText('All projects, including future ones')).toBeInTheDocument()
    expect(await enabledAuthorizeButton()).toBeEnabled()
    expect(screen.queryByRole('combobox', { name: 'Projects' })).not.toBeInTheDocument()
    expect(
      screen.queryByText('Must select at least one project to authorize.')
    ).not.toBeInTheDocument()
  })

  test('an org-wide app in an empty org authorizes and reports an all-projects grant', async () => {
    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () =>
        HttpResponse.json<OAuthAppsAuthorizeRequestData>(
          createMockRequest({
            grant_kind: 'organization_bound',
            project_scoping_mode: false,
          })
        ),
    })
    addAPIMock({
      path: '/platform/organizations',
      method: 'get',
      response: () =>
        HttpResponse.json<Organization[]>([
          createMockOrganization({
            slug: 'northwind-traders',
          }),
        ]),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/projects',
      method: 'get',
      response: () => HttpResponse.json<OrgProjectsResponse>(createMockOrganizationProjects()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id/preflight',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsPreflightValidationData>(createMockPreflight()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id',
      method: 'post',
      response: () =>
        HttpResponse.json<OAuthAppsAuthorizeApproveData>({
          url: '',
        }),
    })
    renderScreen()

    const authorizeButton = await enabledAuthorizeButton()
    expect(screen.queryByText(/No projects in/)).not.toBeInTheDocument()
    fireEvent.click(authorizeButton)

    expect(await screen.findByText('Vercel is connected')).toBeInTheDocument()
    expect(screen.getByText('All projects, including ones created later')).toBeInTheDocument()
  })

  test('re-consent preselects and submits only the still-live projects from the existing grant', async () => {
    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsAuthorizeRequestData>(createMockRequest()),
    })
    addAPIMock({
      path: '/platform/organizations',
      method: 'get',
      response: () =>
        HttpResponse.json<Organization[]>([
          createMockOrganization({
            slug: 'northwind-traders',
          }),
        ]),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/projects',
      method: 'get',
      response: () => HttpResponse.json<OrgProjectsResponse>(createMockOrganizationProjects()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id/preflight',
      method: 'get',
      response: () =>
        HttpResponse.json<OAuthAppsPreflightValidationData>(
          createMockPreflight({
            existing_grant: {
              grant_id: '',
              approved_scopes: ['database:read'],
              project_refs: ['northwindstorefront1', 'northwindstorefront-deleted'],
              approved_at: '2026-08-14T09:12:00.000Z',
            },
          })
        ),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id',
      method: 'post',
      response: () =>
        HttpResponse.json<OAuthAppsAuthorizeApproveData>({
          url: '',
        }),
    })
    renderScreen()

    expect(await screen.findByText('northwind-storefront')).toBeInTheDocument()
    expect(
      screen.queryByText('Must select at least one project to authorize.')
    ).not.toBeInTheDocument()
    const authorizeButton = screen.getByRole('button', { name: /Authorize Vercel/ })
    fireEvent.click(authorizeButton)

    await screen.findByText('Vercel is connected')

    expect(screen.getByText(/northwind-storefront/)).toBeInTheDocument()
    expect(screen.queryByText(/northwind-cms/)).not.toBeInTheDocument()
    expect(screen.queryByText(/northwindstorefront-deleted/)).not.toBeInTheDocument()
  })

  test('optional project scoping offers an all-projects choice that authorizes without a selection', async () => {
    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () =>
        HttpResponse.json<OAuthAppsAuthorizeRequestData>(
          createMockRequest({
            project_scoping_mode: true,
          })
        ),
    })
    addAPIMock({
      path: '/platform/organizations',
      method: 'get',
      response: () =>
        HttpResponse.json<Organization[]>([
          createMockOrganization({
            slug: 'northwind-traders',
          }),
        ]),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/projects',
      method: 'get',
      response: () => HttpResponse.json<OrgProjectsResponse>(createMockOrganizationProjects()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id/preflight',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsPreflightValidationData>(createMockPreflight()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id',
      method: 'post',
      response: () =>
        HttpResponse.json<OAuthAppsAuthorizeApproveData>({
          url: '',
        }),
    })
    renderScreen()

    expect(await screen.findByText('All current and future projects')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Authorize Vercel/ })).toBeDisabled()

    fireEvent.click(screen.getByRole('checkbox'))

    expect(screen.queryByRole('combobox', { name: 'Projects' })).not.toBeInTheDocument()
    const authorizeButton = screen.getByRole('button', { name: /Authorize Vercel/ })
    expect(authorizeButton).toBeEnabled()
    fireEvent.click(authorizeButton)

    expect(await screen.findByText('Vercel is connected')).toBeInTheDocument()
    expect(screen.getByText('All projects, including ones created later')).toBeInTheDocument()
  })

  test('re-consent of an all-projects grant preselects the all-projects choice', async () => {
    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () =>
        HttpResponse.json<OAuthAppsAuthorizeRequestData>(
          createMockRequest({
            project_scoping_mode: true,
          })
        ),
    })
    addAPIMock({
      path: '/platform/organizations',
      method: 'get',
      response: () =>
        HttpResponse.json<Organization[]>([
          createMockOrganization({
            slug: 'northwind-traders',
          }),
        ]),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/projects',
      method: 'get',
      response: () => HttpResponse.json<OrgProjectsResponse>(createMockOrganizationProjects()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id/preflight',
      method: 'get',
      response: () =>
        HttpResponse.json<OAuthAppsPreflightValidationData>(
          createMockPreflight({
            existing_grant: {
              grant_id: '',
              approved_scopes: ['database:read'],
              project_refs: [],
              approved_at: '2026-08-14T09:12:00.000Z',
            },
          })
        ),
    })
    renderScreen()

    await waitFor(() => {
      expect(screen.getByRole('checkbox')).toBeChecked()
    })
    await enabledAuthorizeButton()
  })

  test('a dynamic client is unscoped, with no optional all-projects choice', async () => {
    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () =>
        HttpResponse.json<OAuthAppsAuthorizeRequestData>(
          createMockRequest({
            registration_type: 'dynamic',
            // DCR (MCP) oauth apps are forced org-bound, unscoped.
            grant_kind: 'organization_bound',
            project_scoping_mode: false,
          })
        ),
    })
    addAPIMock({
      path: '/platform/organizations',
      method: 'get',
      response: () =>
        HttpResponse.json<Organization[]>([
          createMockOrganization({
            slug: 'northwind-traders',
          }),
        ]),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/projects',
      method: 'get',
      response: () => HttpResponse.json<OrgProjectsResponse>(createMockOrganizationProjects()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id/preflight',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsPreflightValidationData>(createMockPreflight()),
    })
    renderScreen()

    expect(await screen.findByText('All projects, including future ones')).toBeInTheDocument()
    expect(screen.queryByText('All current and future projects')).not.toBeInTheDocument()
  })

  test('preselects the project named by the project_ref param', async () => {
    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsAuthorizeRequestData>(createMockRequest()),
    })
    addAPIMock({
      path: '/platform/organizations',
      method: 'get',
      response: () =>
        HttpResponse.json<Organization[]>([
          createMockOrganization({
            slug: 'northwind-traders',
          }),
        ]),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/projects',
      method: 'get',
      response: () => HttpResponse.json<OrgProjectsResponse>(createMockOrganizationProjects()),
    })
    addAPIMock({
      path: '/platform/projects/:ref',
      method: 'get',
      response: () =>
        HttpResponse.json<ProjectDetail>(
          createMockProject({
            ref: 'northwindcms1',
            name: 'northwind-cms',
            organization_id: 1,
          })
        ),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id/preflight',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsPreflightValidationData>(createMockPreflight()),
    })
    renderScreen({ organizationSlug: 'northwind-traders', projectRef: 'northwindcms1' })

    expect(await screen.findByText('northwind-cms')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Authorize Vercel/ })).toBeEnabled()
    expect(
      screen.queryByText('Must select at least one project to authorize.')
    ).not.toBeInTheDocument()
  })

  test('a project_scoping_mode off app ignores the project_ref param', async () => {
    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () =>
        HttpResponse.json<OAuthAppsAuthorizeRequestData>(
          createMockRequest({
            project_scoping_mode: false,
          })
        ),
    })
    addAPIMock({
      path: '/platform/organizations',
      method: 'get',
      response: () =>
        HttpResponse.json<Organization[]>([
          createMockOrganization({
            slug: 'northwind-traders',
          }),
        ]),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/projects',
      method: 'get',
      response: () => HttpResponse.json<OrgProjectsResponse>(createMockOrganizationProjects()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id/preflight',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsPreflightValidationData>(createMockPreflight()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id',
      method: 'post',
      response: () =>
        HttpResponse.json<OAuthAppsAuthorizeApproveData>({
          url: '',
        }),
    })
    renderScreen({
      projectRef: 'northwindstorefront1',
    })

    fireEvent.click(await enabledAuthorizeButton())

    expect(await screen.findByText('Vercel is connected')).toBeInTheDocument()
    expect(screen.getByText('All projects, including ones created later')).toBeInTheDocument()
    expect(screen.queryByText(/northwind-storefront/)).not.toBeInTheDocument()
  })

  test('reconsent shows the permissions differences, with previous permissions collapsed', async () => {
    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsAuthorizeRequestData>(createMockRequest()),
    })
    addAPIMock({
      path: '/platform/organizations',
      method: 'get',
      response: () =>
        HttpResponse.json<Organization[]>([
          createMockOrganization({
            slug: 'northwind-traders',
          }),
        ]),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/projects',
      method: 'get',
      response: () => HttpResponse.json<OrgProjectsResponse>(createMockOrganizationProjects()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id/preflight',
      method: 'get',
      response: () =>
        HttpResponse.json<OAuthAppsPreflightValidationData>(
          createMockPreflight({
            existing_grant: {
              grant_id: 'TAILSPIN_VERCEL',
              approved_scopes: [
                'database:read',
                'database:write',
                'analytics:read',
                'projects:read',
                'secrets:read',
                'secrets:write',
                'rest:read',
              ],
              project_refs: ['tailspinshop1', 'tailspindeleted1'],
              approved_at: '2026-08-14T09:12:00.000Z',
            },
          })
        ),
    })
    renderScreen()

    await screen.findByText('Already granted (2)')
    const findSpanWithText = (text: string) =>
      screen.findByText((_, element) => element?.textContent == text, { selector: 'span' })
    await findSpanWithText('Environment (New)')
    await findSpanWithText('Analytics (Upgraded from Read)')
    await findSpanWithText('Secrets (Demoted from Read-write)')
    await findSpanWithText('Edge Functions (New)')
    await findSpanWithText('Storage (New)')
    await findSpanWithText('Rest (Read)')

    expect(screen.queryByText('Database')).toBeNull()
    fireEvent.click(screen.getByText('Already granted (2)'))
    await screen.findByText('Database')
  })

  test('flags the projects the role cannot grant after submit', async () => {
    const READ_ONLY_PROJECTS = ['fabrikam-api', 'fabrikam-jobs']
    const WRITABLE_PROJECT = 'northwind-cms'

    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsAuthorizeRequestData>(createMockRequest()),
    })
    addAPIMock({
      path: '/platform/organizations',
      method: 'get',
      response: () =>
        HttpResponse.json<Organization[]>([
          createMockOrganization({
            slug: 'northwind-traders',
          }),
        ]),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/projects',
      method: 'get',
      response: () =>
        HttpResponse.json<OrgProjectsResponse>(
          createMockOrganizationProjects([
            createMockOrganizationProject({
              ref: 'northwindstorefront1',
              name: 'northwind-storefront',
            }),
            createMockOrganizationProject({
              ref: 'northwindcms1',
              name: 'northwind-cms',
            }),
            createMockOrganizationProject({
              ref: 'fabrikamapi1',
              name: 'fabrikam-api',
            }),
            createMockOrganizationProject({
              ref: 'fabrikamjobs1',
              name: 'fabrikam-jobs',
            }),
          ])
        ),
    })
    addAPIMock({
      path: '/platform/projects/:ref',
      method: 'get',
      response: () => HttpResponse.json<ProjectDetail>(createMockProject({})),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id/preflight',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsPreflightValidationData>(createMockPreflight()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id',
      method: 'post',
      response: () => {
        throw {
          error_code: 'role_validation_failed',
          validation: {
            scope_target: 'projects',
            failures: [
              {
                ref: 'fabrikamapi1',
                role: 'read-only',
                failed_scopes: [],
              },
              {
                ref: 'fabrikamjobs1',
                role: 'read-only',
                failed_scopes: [],
              },
            ],
          },
        }
      },
    })
    renderScreen()
    await selectProject(READ_ONLY_PROJECTS[0])
    await toggleProject(READ_ONLY_PROJECTS[1])
    await toggleProject(WRITABLE_PROJECT)
    fireEvent.click(await enabledAuthorizeButton())
    await screen.findByText("Couldn't authorize 2 projects")

    expect(
      screen.getByText(
        'Vercel needs write access but your role is read-only on the projects highlighted. Deselect them to continue.'
      )
    ).toBeInTheDocument()
    // Counted against the submitted selection
    expect(screen.getByText(/2 of 3\s+projects unavailable/)).toBeInTheDocument()
    // The primary action turns into the deselect shortcut, replacing the inline link
    expect(screen.getByRole('button', { name: 'Deselect 2 projects' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Authorize Vercel/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Deselect projects')).not.toBeInTheDocument()
    // The rejected projects are marked in the dropdown
    expect(screen.getAllByText('- Unavailable')).toHaveLength(READ_ONLY_PROJECTS.length)
    await screen.findByRole('button', { name: 'Deselect 2 projects' })
  })

  test('shows the do-not-close message and hides the cancel action', async () => {
    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsAuthorizeRequestData>(createMockRequest()),
    })
    addAPIMock({
      path: '/platform/organizations',
      method: 'get',
      response: () =>
        HttpResponse.json<Organization[]>([
          createMockOrganization({
            slug: 'northwind-traders',
          }),
        ]),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/projects',
      method: 'get',
      response: () => HttpResponse.json<OrgProjectsResponse>(createMockOrganizationProjects()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id/preflight',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsPreflightValidationData>(createMockPreflight()),
    })
    addAPIMock({
      path: '/platform/oauth/authorizations/:id',
      method: 'get',
      response: () => HttpResponse.json<OAuthAppsAuthorizeRequestData>(createMockRequest()),
    })
    addAPIMock({
      path: '/platform/organizations/:slug/oauth/authorizations/:id',
      method: 'post',
      response: async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json<OAuthAppsAuthorizeApproveData>({
          url: '',
        })
      },
    })
    renderScreen()

    await selectProject('northwind-cms')
    fireEvent.click(await enabledAuthorizeButton())
    expect(await screen.findByText('Authorizing...')).toBeInTheDocument()
    expect(screen.getByText("Don't close this window.")).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()

    expect(await screen.findByText('Vercel is connected')).toBeInTheDocument()
    expect(screen.getByText('You can return to Vercel to continue')).toBeInTheDocument()
  })
})
