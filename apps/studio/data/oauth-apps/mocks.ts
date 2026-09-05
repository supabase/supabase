import type { OAuthAppsAuthorizeGrant } from './oauth-apps-authorize-approve-mutation'
import type { OAuthAppsAuthorizeOrganizationProject } from './oauth-apps-authorize-organization-projects-query'
import type { OAuthAppsAuthorizeIdentity } from './oauth-apps-authorize-organizations-query'
import type { OAuthAppsAuthorizeRequest } from './oauth-apps-authorize-request-query'
import type { OAuthOrganizationRole, OAuthScopeGroup } from './types'

// Real endpoints don't exist yet (PROD-625). ENABLE_MOCKS is a compile-time literal, not an
// env var or feature flag, so it can't be flipped remotely — and it's always false once bundled
// for production regardless of its value here.
const ENABLE_MOCKS = true
export const USE_MOCKS = ENABLE_MOCKS && process.env.NODE_ENV !== 'production'

export const OAUTH_APPS_MOCK_SCENARIOS = {
  vercelDeveloper: 'mock-vercel-developer',
  vercelReadOnly: 'mock-vercel-readonly',
  kemalBot: 'mock-kemal-bot',
} as const

const VERCEL_SCOPE_GROUPS: OAuthScopeGroup[] = [
  {
    name: 'Project Settings, Action Runs, Logs, SQL Snippets',
    level: 'read_write',
    scopes: ['project_settings', 'action_runs', 'logs', 'sql_snippets'],
  },
  {
    name: 'Database Webhooks, Development Branches, Production Branches',
    level: 'read',
    scopes: ['database_webhooks', 'development_branches', 'production_branches'],
  },
]

const VERCEL_REQUEST: OAuthAppsAuthorizeRequest = {
  client_id: 'vercel',
  app_name: 'Vercel',
  publisher: 'Vercel Inc.',
  is_verified: true,
  redirect_uri: 'https://vercel.com/api/integrations/supabase/callback',
  scope_groups: VERCEL_SCOPE_GROUPS,
}

const KEMAL_BOT_REQUEST: OAuthAppsAuthorizeRequest = {
  client_id: 'kemal-bot',
  app_name: 'kemal-bot',
  publisher: 'kemal-bot',
  is_verified: false,
  redirect_uri: 'https://kemal.lol/hollerback',
  scope_groups: [
    {
      name: 'Project Settings',
      level: 'read',
      scopes: ['project_settings'],
    },
  ],
}

const MOCK_AUTHORIZE_REQUESTS: Record<string, OAuthAppsAuthorizeRequest> = {
  [OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper]: VERCEL_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.vercelReadOnly]: VERCEL_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.kemalBot]: KEMAL_BOT_REQUEST,
}

const NORTHWIND_TRADERS_DEVELOPER: OAuthOrganizationRole = {
  slug: 'northwind-traders',
  name: 'Northwind Traders',
  role: 'Developer',
}

const NORTHWIND_TRADERS_READ_ONLY: OAuthOrganizationRole = {
  ...NORTHWIND_TRADERS_DEVELOPER,
  role: 'Read-only',
}

const SOME_OTHER_ORG: OAuthOrganizationRole = {
  slug: 'some-other-org',
  name: 'some-other-org',
  role: 'Owner',
}

const MOCK_IDENTITIES: Record<string, OAuthAppsAuthorizeIdentity> = {
  [OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper]: {
    email: 'kemal@supabase.io',
    organizations: [NORTHWIND_TRADERS_DEVELOPER, SOME_OTHER_ORG],
  },
  [OAUTH_APPS_MOCK_SCENARIOS.vercelReadOnly]: {
    email: 'kemal@supabase.io',
    organizations: [NORTHWIND_TRADERS_READ_ONLY, SOME_OTHER_ORG],
  },
  [OAUTH_APPS_MOCK_SCENARIOS.kemalBot]: {
    email: 'kemal@supabase.io',
    organizations: [NORTHWIND_TRADERS_DEVELOPER, SOME_OTHER_ORG],
  },
}

const MOCK_ORGANIZATION_PROJECTS: Record<string, OAuthAppsAuthorizeOrganizationProject[]> = {
  'northwind-traders': [
    { ref: 'northwindtradersprod1', name: 'production' },
    { ref: 'northwindtradersstag1', name: 'staging' },
  ],
  'some-other-org': [],
}

export function getMockOAuthAppsAuthorizeRequest(id: string): OAuthAppsAuthorizeRequest {
  const request = MOCK_AUTHORIZE_REQUESTS[id]
  if (!request) throw new Error(`No mock authorize request for id "${id}"`)
  return request
}

export function getMockOAuthAppsAuthorizeIdentity(id: string): OAuthAppsAuthorizeIdentity {
  const identity = MOCK_IDENTITIES[id]
  if (!identity) throw new Error(`No mock identity for id "${id}"`)
  return identity
}

export function getMockOAuthAppsAuthorizeOrganizationProjects(
  slug: string
): OAuthAppsAuthorizeOrganizationProject[] {
  return MOCK_ORGANIZATION_PROJECTS[slug] ?? []
}

export function getMockOAuthAppsAuthorizeGrant(
  id: string,
  slug: string,
  projectRefs: string[]
): OAuthAppsAuthorizeGrant {
  const request = getMockOAuthAppsAuthorizeRequest(id)
  const identity = getMockOAuthAppsAuthorizeIdentity(id)
  const organization = identity.organizations.find((org) => org.slug === slug)
  if (!organization) throw new Error(`User does not belong to organization "${slug}"`)

  const projects = getMockOAuthAppsAuthorizeOrganizationProjects(slug).filter((project) =>
    projectRefs.includes(project.ref)
  )

  return {
    email: identity.email,
    role: organization.role,
    organization_slug: organization.slug,
    projects,
    scope_groups: request.scope_groups,
  }
}

function buildMockRedirectUrl(redirectUri: string, params: Record<string, string>) {
  const url = new URL(redirectUri)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
  return url.toString()
}

export function getMockOAuthAppsAuthorizeRedirect(id: string, { approved }: { approved: boolean }) {
  const request = getMockOAuthAppsAuthorizeRequest(id)
  const url = approved
    ? buildMockRedirectUrl(request.redirect_uri, { code: 'mock_authorization_code' })
    : buildMockRedirectUrl(request.redirect_uri, {
        error: 'access_denied',
        error_description: 'The user denied the authorization request',
      })

  return { url }
}
