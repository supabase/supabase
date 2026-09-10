import type { OAuthAppsAuthorizeIdentity } from './oauth-apps-authorize-organizations-query'
import type { OAuthAppsAuthorizeRequest } from './oauth-apps-authorize-request-query'
import type {
  OAuthAppGrantConfig,
  OAuthAppsAuthorizeApproveResult,
  OAuthAppsAuthorizeOrganizationProject,
  OAuthExistingGrant,
  OAuthGrantProjectScope,
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
  // One scenario per app type from the addendum, so every branch of the consent model is
  // reachable from a URL. The scenarios above are all type D.
  vercelOptionalProjects: 'mock-vercel-optional-projects',
  vercelAllProjects: 'mock-vercel-all-projects',
  vercelReconsentAllProjects: 'mock-vercel-reconsent-all-projects',
  kemalBotOrgWide: 'mock-kemal-bot-org-wide',
  dynamicMcpClient: 'mock-dynamic-mcp-client',
} as const

/** Type D: the shape the addendum treats as the full migration, and the default for new fixtures. */
const USER_BOUND_REQUIRED_PROJECTS: OAuthAppGrantConfig = {
  bind_to_authorizing_user: true,
  project_selection: 'required',
  is_dynamic_client: false,
}

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
  grant_config: USER_BOUND_REQUIRED_PROJECTS,
  existing_grant: null,
}

const VERCEL_EXISTING_GRANT: OAuthExistingGrant = {
  kind: 'user_bound',
  approved_scopes: ['project_settings', 'logs'],
  project_scope: {
    target: 'selected_projects',
    project_refs: ['northwindstorefront1', 'northwindcms1', 'northwinddeleted1'],
  },
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

/** Type D on `optional`: the picker renders alongside an all-current-and-future-projects choice. */
const VERCEL_OPTIONAL_PROJECTS_REQUEST: OAuthAppsAuthorizeRequest = {
  ...VERCEL_REQUEST,
  grant_config: { ...USER_BOUND_REQUIRED_PROJECTS, project_selection: 'optional' },
}

/** Type C: the member's own permissions, but no picker — the grant covers the whole org. */
const VERCEL_ALL_PROJECTS_REQUEST: OAuthAppsAuthorizeRequest = {
  ...VERCEL_REQUEST,
  grant_config: { ...USER_BOUND_REQUIRED_PROJECTS, project_selection: 'off' },
}

// Re-consenting out of an all-projects grant. Separate from VERCEL_EXISTING_GRANT because the two
// scopes are different union members, and the screen has to preselect each one differently.
const VERCEL_ALL_PROJECTS_EXISTING_GRANT: OAuthExistingGrant = {
  ...VERCEL_EXISTING_GRANT,
  project_scope: { target: 'all_projects' },
}

const VERCEL_RECONSENT_ALL_PROJECTS_REQUEST: OAuthAppsAuthorizeRequest = {
  ...VERCEL_OPTIONAL_PROJECTS_REQUEST,
  existing_grant: VERCEL_ALL_PROJECTS_EXISTING_GRANT,
}

/**
 * Type E: a dynamic MCP client. The flags are forced by Supabase, so this fixture deliberately
 * carries a stale `project_selection: 'off'` — `getOAuthConsentModel` must still show the picker.
 */
const DYNAMIC_MCP_CLIENT_REQUEST: OAuthAppsAuthorizeRequest = {
  ...VERCEL_REQUEST,
  client_id: 'dynamic-mcp-client',
  app_name: 'Northwind MCP',
  publisher: 'Registered dynamically',
  is_verified: false,
  redirect_uri: 'https://mcp.northwind.example/callback',
  grant_config: {
    bind_to_authorizing_user: false,
    project_selection: 'off',
    is_dynamic_client: true,
  },
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
  // Type B: the author turned on project selection but kept the shared owner-approved grant.
  grant_config: {
    bind_to_authorizing_user: false,
    project_selection: 'required',
    is_dynamic_client: false,
  },
  existing_grant: null,
}

/**
 * Type A: the author never opened the settings page. Every app that exists today is in this state
 * on day one — an org owner approves once, org-wide, with owner-level permissions.
 */
const KEMAL_BOT_ORG_WIDE_REQUEST: OAuthAppsAuthorizeRequest = {
  ...KEMAL_BOT_REQUEST,
  grant_config: {
    bind_to_authorizing_user: false,
    project_selection: 'off',
    is_dynamic_client: false,
  },
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
  [OAUTH_APPS_MOCK_SCENARIOS.vercelOptionalProjects]: VERCEL_OPTIONAL_PROJECTS_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.vercelAllProjects]: VERCEL_ALL_PROJECTS_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.vercelReconsentAllProjects]: VERCEL_RECONSENT_ALL_PROJECTS_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.kemalBotOrgWide]: KEMAL_BOT_ORG_WIDE_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.dynamicMcpClient]: DYNAMIC_MCP_CLIENT_REQUEST,
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
  // Types A and B need an owner to approve at all, so this pair is deliberately mixed: Northwind
  // is the blocked-member state, Contoso Labs is the only org where approval can proceed.
  [OAUTH_APPS_MOCK_SCENARIOS.kemalBot]: {
    email: 'admin@example.com',
    organizations: [NORTHWIND_TRADERS_DEVELOPER, CONTOSO_LABS],
  },
  [OAUTH_APPS_MOCK_SCENARIOS.kemalBotOrgWide]: {
    email: 'admin@example.com',
    organizations: [NORTHWIND_TRADERS_DEVELOPER, CONTOSO_LABS],
  },
  [OAUTH_APPS_MOCK_SCENARIOS.vercelOptionalProjects]: {
    email: 'admin@example.com',
    organizations: [NORTHWIND_TRADERS_DEVELOPER, CONTOSO_LABS],
  },
  // Northwind holds read-only on two of its four projects and Vercel requests write scopes, so
  // this is the type C case the addendum leaves open: nothing to deselect, nothing to fix.
  [OAUTH_APPS_MOCK_SCENARIOS.vercelAllProjects]: {
    email: 'admin@example.com',
    organizations: [NORTHWIND_TRADERS_DEVELOPER, CONTOSO_LABS],
  },
  [OAUTH_APPS_MOCK_SCENARIOS.vercelReconsentAllProjects]: {
    email: 'admin@example.com',
    organizations: [NORTHWIND_TRADERS_DEVELOPER, CONTOSO_LABS],
  },
  [OAUTH_APPS_MOCK_SCENARIOS.dynamicMcpClient]: {
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

// Only these scenarios run the post-submit role check, so every state that predates it keeps
// approving whatever it is handed. `vercelAllProjects` is in the set because a hidden picker does
// not exempt a grant from validation — it just leaves the user with no way to resolve a failure.
const ROLE_VALIDATED_SCENARIOS = new Set<string>([
  OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation,
  OAUTH_APPS_MOCK_SCENARIOS.vercelAllProjects,
])

const WRITE_SCOPE_LEVELS: OAuthScopeLevel[] = ['write', 'read_write']

/**
 * Derives the outcome from the submitted scope rather than returning a canned failure, so
 * deselecting the flagged projects and retrying actually succeeds.
 */
export function getMockOAuthAppsAuthorizeApproveResult(
  authId: string,
  { slug, projectScope }: { slug: string; projectScope: OAuthGrantProjectScope }
): OAuthAppsAuthorizeApproveResult {
  const approved = getMockOAuthAppsAuthorizeRedirect(authId, { approved: true })
  if (!ROLE_VALIDATED_SCENARIOS.has(authId)) return approved

  const writeGroups = getMockOAuthAppsAuthorizeRequest(authId).scope_groups.filter((scopeGroup) =>
    WRITE_SCOPE_LEVELS.includes(scopeGroup.level)
  )
  if (writeGroups.length === 0) return approved

  // An all-projects grant is validated against every project in the org, which is what makes it
  // possible for the check to fail with no selection the user can narrow.
  const orgProjects = getMockOAuthAppsAuthorizeOrganizationProjects(slug)
  const submitted =
    projectScope.target === 'all_projects'
      ? orgProjects
      : orgProjects.filter((project) => projectScope.project_refs.includes(project.ref))

  const blocked = submitted.filter((project) => project.role === 'read_only')
  if (blocked.length === 0) return approved

  // Every blocked project fails the same scopes here because the mock blocks on one condition
  // (a read-only role). The real check resolves scopes per project, so the shape stays per-project
  // even though these lists happen to be identical.
  const failedScopes = writeGroups.flatMap((scopeGroup) => scopeGroup.scopes)

  return {
    error_code: 'role_validation_failed',
    message: `Your role is read-only on ${blocked.length} of the selected projects.`,
    validation: {
      scope_target: 'projects',
      failures: blocked.map(({ name, ref, role }) => ({
        ref,
        name,
        role,
        failed_scopes: failedScopes,
      })),
    },
  }
}
