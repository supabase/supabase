import { screen, waitFor } from '@testing-library/react'
import { mockIntersectionObserver } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { createMockOrganization } from '../helpers'
import { addAPIMock } from '../lib/msw'
import { createMockProfileContext } from '../lib/profile-helpers'
import { OAuthAppsAuthorizeRequestData } from '@/data/oauth-apps/oauth-apps-authorize-request-query'
import { OAuthAppsPreflightValidationData } from '@/data/oauth-apps/oauth-apps-preflight-validation-query'
import { OrgProject, OrgProjectsResponse } from '@/data/projects/org-projects-infinite-query'
import { ProjectDetail } from '@/data/projects/project-detail-query'
import { Route } from '@/routes/authorize'
import { renderRoute } from '@/tests/lib/route-render'
import { Organization } from '@/types'

vi.mock('@/hooks/misc/withAuth', () => ({
  withAuth: (Component: React.ComponentType) => Component,
}))

const flags = vi.hoisted(() => ({ consent: false }))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useFlag: (key: string) => key === 'enableScopedOAuthConsent' && flags.consent,
  }
})

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

const renderAuthorize = (url = '/authorize') =>
  renderRoute(Route, {
    routeId: '/authorize',
    url,
    profileContext: createMockProfileContext(),
  })

describe('/authorize', () => {
  mockIntersectionObserver()

  afterEach(() => {
    flags.consent = false
    document.title = ''
  })

  test('renders loading interstitial while the authorization request loads', async () => {
    flags.consent = true

    await renderAuthorize('/authorize?auth_id=some_id')

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  test('renders the legacy component when the enableScopedOAuthConsent flag is off', async () => {
    await renderAuthorize()

    expect(screen.getByText('Missing authorization link')).toBeInTheDocument()
    expect(screen.queryByText(/is connected/)).not.toBeInTheDocument()
  })

  test('updates the document title with the requester name in the legacy authorize screen', async () => {
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
            name: 'Northwind Traders',
          }),
        ]),
    })

    await renderAuthorize('/authorize?auth_id=some_id')

    await waitFor(() => {
      expect(document.title).toBe('Authorize Vercel | Supabase')
    })
  })

  test('correctly select the organization from the organization_slug', async () => {
    flags.consent = true
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
            slug: 'anotherorg',
            name: 'Another org',
          }),
          createMockOrganization({
            id: 2,
            slug: 'northwind-traders',
            name: 'Northwind Traders',
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
      path: '/platform/projects/:ref',
      method: 'get',
      response: () => HttpResponse.json<ProjectDetail>(createMockProject()),
    })
    await renderAuthorize('/authorize?auth_id=some_id&organization_slug=northwind-traders')

    await screen.findByText('Northwind Traders')
  })

  test('preselects projects from repeated project_ref params', async () => {
    flags.consent = true
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
      path: '/platform/projects/:ref',
      method: 'get',
      response: () => HttpResponse.json<ProjectDetail>(createMockProject()),
    })
    await renderAuthorize(
      '/authorize?auth_id=some_id&organization_slug=northwind-traders&project_ref=northwindstorefront1&project_ref=northwindcms1'
    )

    expect(await screen.findByText('northwind-storefront')).toBeInTheDocument()
  })

  test('normalises a single project_ref param to a one-item preselection', async () => {
    flags.consent = true
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
      path: '/platform/projects/:ref',
      method: 'get',
      response: () =>
        HttpResponse.json<ProjectDetail>(
          createMockProject({
            ref: 'northwindcms1',
          })
        ),
    })

    await renderAuthorize(
      '/authorize?auth_id=some_id&organization_slug=northwind-traders&project_ref=northwindcms1'
    )

    expect(await screen.findByText('northwind-cms')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Authorize Vercel/ })).toBeEnabled()
  })
})
