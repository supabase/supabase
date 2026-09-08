import type { OAuthAppsAuthorizeIdentity } from './oauth-apps-authorize-organizations-query'
import type { OAuthAppsAuthorizeRequest } from './oauth-apps-authorize-request-query'
import type {
  OAuthAppsAuthorizeApproveResult,
  OAuthAppsAuthorizeOrganizationProject,
  OAuthExistingGrant,
  OAuthOrganizationRole,
  OAuthScopeGroup,
  OAuthScopeLevel,
} from './types'

const ENABLE_MOCKS = true
export const USE_MOCKS = ENABLE_MOCKS && process.env.NODE_ENV !== 'production'

export const OAUTH_APPS_MOCK_SCENARIOS = {
  vercelDeveloper: 'mock-vercel-developer',
  vercelReadOnly: 'mock-vercel-readonly',
  vercelReconsent: 'mock-vercel-reconsent',
  vercelCrossWorkspace: 'mock-vercel-cross-workspace',
  vercelOrgAdmin: 'mock-vercel-org-admin',
  vercelManyProjects: 'mock-vercel-many-projects',
  vercelRoleValidation: 'mock-vercel-role-validation',
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
  reuses_grant_across_workspaces: false,
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

const VERCEL_CROSS_WORKSPACE_REQUEST: OAuthAppsAuthorizeRequest = {
  ...VERCEL_REQUEST,
  reuses_grant_across_workspaces: true,
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
  reuses_grant_across_workspaces: false,
  existing_grant: null,
}

const MOCK_AUTHORIZE_REQUESTS: Record<string, OAuthAppsAuthorizeRequest> = {
  [OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper]: VERCEL_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.vercelReadOnly]: VERCEL_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.vercelReconsent]: VERCEL_RECONSENT_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.vercelCrossWorkspace]: VERCEL_CROSS_WORKSPACE_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.vercelOrgAdmin]: VERCEL_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.vercelManyProjects]: VERCEL_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation]: VERCEL_REQUEST,
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

const TAILSPIN_TOYS_ADMIN: OAuthOrganizationRole = {
  slug: 'tailspin-toys',
  name: 'Tailspin Toys',
  default_role: 'administrator',
}

// Contoso Labs is the other owner-role fixture, but it is deliberately empty, so it can never
// reach the admin warning. This one carries projects.
const FABRIKAM_OWNER: OAuthOrganizationRole = {
  slug: 'fabrikam-industries',
  name: 'Fabrikam Industries',
  default_role: 'owner',
}

// Deliberately a plain developer: an owner/admin role would stack the "scoped to one member"
// warning onto the screen and muddy the selection-cap preview.
const WINGTIP_TOYS_DEVELOPER: OAuthOrganizationRole = {
  slug: 'wingtip-toys',
  name: 'Wingtip Toys',
  default_role: 'developer',
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
  [OAUTH_APPS_MOCK_SCENARIOS.vercelCrossWorkspace]: {
    email: 'admin@example.com',
    // Tailspin Toys is a member org here purely so the stacked case (this notice plus the
    // org-admin warning) is reachable via `?organization_slug=tailspin-toys`.
    organizations: [NORTHWIND_TRADERS_DEVELOPER, CONTOSO_LABS, TAILSPIN_TOYS_ADMIN],
  },
  [OAUTH_APPS_MOCK_SCENARIOS.vercelOrgAdmin]: {
    email: 'admin@example.com',
    organizations: [TAILSPIN_TOYS_ADMIN, FABRIKAM_OWNER, NORTHWIND_TRADERS_DEVELOPER],
  },
  [OAUTH_APPS_MOCK_SCENARIOS.vercelManyProjects]: {
    email: 'admin@example.com',
    organizations: [WINGTIP_TOYS_DEVELOPER, NORTHWIND_TRADERS_DEVELOPER],
  },
  [OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation]: {
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
  'wingtip-toys': [
    { ref: 'wingtipweb1', name: 'wingtip-web', role: 'administrator' },
    { ref: 'wingtipapi1', name: 'wingtip-api', role: 'developer' },
    { ref: 'wingtipadmin1', name: 'wingtip-admin', role: 'developer' },
    { ref: 'wingtipjobs1', name: 'wingtip-jobs', role: 'developer' },
    { ref: 'wingtipsearch1', name: 'wingtip-search', role: 'read_only' },
    { ref: 'wingtipbilling1', name: 'wingtip-billing', role: 'administrator' },
    { ref: 'wingtipmail1', name: 'wingtip-mail', role: 'developer' },
    { ref: 'wingtipmedia1', name: 'wingtip-media', role: 'developer' },
    { ref: 'wingtipmetrics1', name: 'wingtip-metrics', role: 'read_only' },
    { ref: 'wingtipstaging1', name: 'wingtip-staging', role: 'developer' },
    { ref: 'wingtippreview1', name: 'wingtip-preview', role: 'developer' },
    { ref: 'wingtipsandbox1', name: 'wingtip-sandbox', role: 'read_only' },
  ],
  'fabrikam-industries': [
    { ref: 'fabrikamledger1', name: 'fabrikam-ledger', role: 'administrator' },
  ],
  'tailspin-toys': [
    { ref: 'tailspinshop1', name: 'tailspin-shop', role: 'administrator' },
    { ref: 'tailspinwarehouse1', name: 'tailspin-warehouse', role: 'developer' },
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

// Only this scenario runs the post-submit role check, so every state that predates it keeps
// approving whatever it is handed.
const ROLE_VALIDATED_SCENARIOS = new Set<string>([OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation])

const WRITE_SCOPE_LEVELS: OAuthScopeLevel[] = ['write', 'read_write']

/**
 * Derives the outcome from the submitted refs rather than returning a canned failure, so
 * deselecting the flagged projects and retrying actually succeeds.
 */
export function getMockOAuthAppsAuthorizeApproveResult(
  authId: string,
  { slug, projectRefs }: { slug: string; projectRefs: string[] }
): OAuthAppsAuthorizeApproveResult {
  const approved = getMockOAuthAppsAuthorizeRedirect(authId, { approved: true })
  if (!ROLE_VALIDATED_SCENARIOS.has(authId)) return approved

  const writeGroups = getMockOAuthAppsAuthorizeRequest(authId).scope_groups.filter((scopeGroup) =>
    WRITE_SCOPE_LEVELS.includes(scopeGroup.level)
  )
  if (writeGroups.length === 0) return approved

  const blocked = getMockOAuthAppsAuthorizeOrganizationProjects(slug).filter(
    (project) => projectRefs.includes(project.ref) && project.role === 'read_only'
  )
  if (blocked.length === 0) return approved

  return {
    error_code: 'role_validation_failed',
    message: `Your role is read-only on ${blocked.length} of the selected projects.`,
    failed_scopes: writeGroups.flatMap((scopeGroup) => scopeGroup.scopes),
    projects: blocked.map(({ name, ref, role }) => ({ name, ref, role })),
    roles: Array.from(new Set(blocked.map((project) => project.role))),
  }
}
