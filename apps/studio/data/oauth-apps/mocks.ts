import type { OAuthAppsAuthorizeIdentity } from './oauth-apps-authorize-organizations-query'
import type { OAuthAppsAuthorizeRequest } from './oauth-apps-authorize-request-query'
import type {
  OAuthAppsAuthorizeOrganizationProject,
  OAuthExistingGrant,
  OAuthOrganizationRole,
  OAuthScopeGroup,
} from './types'

const ENABLE_MOCKS = true
export const USE_MOCKS = ENABLE_MOCKS && process.env.NODE_ENV !== 'production'

export const OAUTH_APPS_MOCK_SCENARIOS = {
  vercelDeveloper: 'mock-vercel-developer',
  vercelReadOnly: 'mock-vercel-readonly',
  vercelReconsent: 'mock-vercel-reconsent',
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
  existing_grant: null,
}

const VERCEL_EXISTING_GRANT: OAuthExistingGrant = {
  approved_scopes: ['project_settings', 'logs'],
  project_refs: ['northwindstorefront1', 'northwindcms1', 'northwinddeleted1'],
  created_at: '2026-08-14T09:12:00.000Z',
  updated_at: '2026-08-29T16:40:00.000Z',
}

const VERCEL_RECONSENT_REQUEST: OAuthAppsAuthorizeRequest = {
  ...VERCEL_REQUEST,
  existing_grant: VERCEL_EXISTING_GRANT,
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
  existing_grant: null,
}

const MOCK_AUTHORIZE_REQUESTS: Record<string, OAuthAppsAuthorizeRequest> = {
  [OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper]: VERCEL_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.vercelReadOnly]: VERCEL_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.vercelReconsent]: VERCEL_RECONSENT_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.kemalBot]: KEMAL_BOT_REQUEST,
}

const NORTHWIND_TRADERS_DEVELOPER: OAuthOrganizationRole = {
  slug: 'northwind-traders',
  name: 'Northwind Traders',
  default_role: 'developer',
}

const NORTHWIND_TRADERS_READ_ONLY: OAuthOrganizationRole = {
  ...NORTHWIND_TRADERS_DEVELOPER,
  default_role: 'read_only',
}

const CONTOSO_LABS: OAuthOrganizationRole = {
  slug: 'contoso-labs',
  name: 'Contoso Labs',
  default_role: 'owner',
}

const MOCK_IDENTITIES: Record<string, OAuthAppsAuthorizeIdentity> = {
  [OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper]: {
    email: 'admin@example.com',
    organizations: [NORTHWIND_TRADERS_DEVELOPER, CONTOSO_LABS],
  },
  [OAUTH_APPS_MOCK_SCENARIOS.vercelReadOnly]: {
    email: 'admin@example.com',
    organizations: [NORTHWIND_TRADERS_READ_ONLY, CONTOSO_LABS],
  },
  [OAUTH_APPS_MOCK_SCENARIOS.vercelReconsent]: {
    email: 'admin@example.com',
    organizations: [NORTHWIND_TRADERS_DEVELOPER, CONTOSO_LABS],
  },
  [OAUTH_APPS_MOCK_SCENARIOS.kemalBot]: {
    email: 'admin@example.com',
    organizations: [NORTHWIND_TRADERS_DEVELOPER, CONTOSO_LABS],
  },
}

const MOCK_ORGANIZATION_PROJECTS: Record<string, OAuthAppsAuthorizeOrganizationProject[]> = {
  'northwind-traders': [
    { ref: 'northwindstorefront1', name: 'northwind-storefront', role: 'administrator' },
    { ref: 'northwindcms1', name: 'northwind-cms', role: 'developer' },
    { ref: 'fabrikamapi1', name: 'fabrikam-api', role: 'read_only' },
    { ref: 'fabrikamjobs1', name: 'fabrikam-jobs', role: 'read_only' },
  ],
  'contoso-labs': [],
}

export function getMockOAuthAppsAuthorizeRequest(authId: string): OAuthAppsAuthorizeRequest {
  const request = MOCK_AUTHORIZE_REQUESTS[authId]
  if (!request) throw new Error(`No mock authorize request for id "${authId}"`)
  return request
}

export function getMockOAuthAppsAuthorizeIdentity(authId: string): OAuthAppsAuthorizeIdentity {
  const identity = MOCK_IDENTITIES[authId]
  if (!identity) throw new Error(`No mock identity for id "${authId}"`)
  return identity
}

export function getMockOAuthAppsAuthorizeOrganizationProjects(
  slug: string
): OAuthAppsAuthorizeOrganizationProject[] {
  return MOCK_ORGANIZATION_PROJECTS[slug] ?? []
}

const MOCK_OAUTH_STATE = 'mock_state_9f2c1b'

function buildMockRedirectUrl(redirectUri: string, params: Record<string, string>) {
  const url = new URL(redirectUri)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value))
  return url.toString()
}

export function getMockOAuthAppsAuthorizeRedirect(
  authId: string,
  { approved }: { approved: boolean }
) {
  const request = getMockOAuthAppsAuthorizeRequest(authId)
  const url = approved
    ? buildMockRedirectUrl(request.redirect_uri, {
        code: 'mock_authorization_code',
        state: MOCK_OAUTH_STATE,
      })
    : buildMockRedirectUrl(request.redirect_uri, {
        error: 'access_denied',
        error_description: 'The user denied the authorization request',
        state: MOCK_OAUTH_STATE,
      })

  return { url }
}
