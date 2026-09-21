import type { OAuthAppsAuthorizeIdentity } from './oauth-apps-authorize-organizations-query'
import type {
  ListAppGrantsResponse,
  ListBlockedAppsResponse,
  ListOAuthAppsOverviewResponse,
  OAuthAppsAuthorizeApproveResult,
  OAuthAppsAuthorizeOrganizationProject,
  OAuthAppsAuthorizeRequest,
  OAuthExistingGrant,
  OAuthOrganizationRole,
  OAuthOrgAppDetails,
  OAuthScope,
  OAuthScopeGroup,
  OAuthScopeLevel,
} from './types'
import type { OrganizationRole } from '@/data/organization-members/organization-roles-query'

const ENABLE_MOCKS = true
export const USE_MOCKS = ENABLE_MOCKS && process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod'

export const OAUTH_APPS_MOCK_SCENARIOS = {
  vercelDeveloper: 'mock-vercel-developer',
  vercelReadOnly: 'mock-vercel-readonly',
  vercelReconsent: 'mock-vercel-reconsent',
  vercelOrgAdmin: 'mock-vercel-org-admin',
  vercelManyProjects: 'mock-vercel-many-projects',
  vercelRoleValidation: 'mock-vercel-role-validation',
  vercelBlocked: 'mock-vercel-blocked',
  vercelOptionalProjects: 'mock-vercel-optional-projects',
  vercelAllProjects: 'mock-vercel-all-projects',
  vercelReconsentAllProjects: 'mock-vercel-reconsent-all-projects',
  kemalBot: 'mock-kemal-bot',
  kemalBotOrgWide: 'mock-kemal-bot-org-wide',
  dynamicMcpClient: 'mock-dynamic-mcp-client',
} as const

export const OWNER_ROLE: OrganizationRole = {
  id: 1,
  base_role_id: 1,
  name: 'Owner',
  description: null,
  projects: [],
}

export const ADMINISTRATOR_ROLE: OrganizationRole = {
  id: 2,
  base_role_id: 2,
  name: 'Administrator',
  description: null,
  projects: [],
}

export const DEVELOPER_ROLE: OrganizationRole = {
  id: 3,
  base_role_id: 3,
  name: 'Developer',
  description: null,
  projects: [],
}

export const READ_ONLY_ROLE: OrganizationRole = {
  id: 4,
  base_role_id: 4,
  name: 'Read-only',
  description: null,
  projects: [],
}

const VERCEL_SCOPE_GROUPS: OAuthScopeGroup[] = [
  {
    name: 'Database, Environment, Secrets',
    level: 'read_write',
    scopes: [
      'database:read',
      'database:write',
      'environment:read',
      'environment:write',
      'secrets:read',
      'secrets:write',
    ],
  },
  {
    name: 'Projects, Edge Functions, Storage',
    level: 'read',
    scopes: ['projects:read', 'edge_functions:read', 'storage:read'],
  },
]

const VERCEL_REQUEST: OAuthAppsAuthorizeRequest = {
  app_id: 'vercel',
  app_name: 'Vercel',
  name: 'Vercel',
  website: 'https://vercel.com',
  domain: 'vercel.com',
  redirect_uri: 'https://vercel.com/api/integrations/supabase/callback',
  registration_type: 'manual',
  expires_at: '2026-09-17T12:00:00.000Z',
  grant_kind: 'member_bound',
  project_scoping_mode: 'required',
  allow_partial_grants: false,
  scopes: VERCEL_SCOPE_GROUPS,
}

const VERCEL_OPTIONAL_PROJECTS_REQUEST: OAuthAppsAuthorizeRequest = {
  ...VERCEL_REQUEST,
  app_id: 'vercel-optional',
  project_scoping_mode: 'optional',
  allow_partial_grants: true,
}

const VERCEL_ALL_PROJECTS_REQUEST: OAuthAppsAuthorizeRequest = {
  ...VERCEL_REQUEST,
  app_id: 'vercel-org-wide',
  project_scoping_mode: 'off',
}

const DYNAMIC_MCP_CLIENT_REQUEST: OAuthAppsAuthorizeRequest = {
  ...VERCEL_REQUEST,
  app_id: 'dynamic-mcp-client',
  app_name: 'Northwind MCP',
  name: 'Northwind MCP',
  website: 'https://mcp.northwind.example',
  domain: 'mcp.northwind.example',
  redirect_uri: 'https://mcp.northwind.example/callback',
  registration_type: 'dynamic',
}

const KEMAL_BOT_REQUEST: OAuthAppsAuthorizeRequest = {
  app_id: 'kemal-bot',
  app_name: 'kemal-bot',
  name: 'kemal-bot',
  website: 'https://kemal.lol',
  domain: 'kemal.lol',
  redirect_uri: 'https://kemal.lol/hollerback',
  registration_type: 'manual',
  expires_at: '2026-09-17T12:00:00.000Z',
  grant_kind: 'organization_bound',
  project_scoping_mode: 'required',
  allow_partial_grants: false,
  scopes: [
    {
      name: 'Projects',
      level: 'read',
      scopes: ['projects:read'],
    },
  ],
}

const KEMAL_BOT_ORG_WIDE_REQUEST: OAuthAppsAuthorizeRequest = {
  ...KEMAL_BOT_REQUEST,
  app_id: 'kemal-bot-org-wide',
  project_scoping_mode: 'off',
}

const MOCK_AUTHORIZE_REQUESTS: Record<string, OAuthAppsAuthorizeRequest> = {
  [OAUTH_APPS_MOCK_SCENARIOS.vercelDeveloper]: VERCEL_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.vercelReadOnly]: VERCEL_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.vercelReconsent]: VERCEL_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.vercelOrgAdmin]: VERCEL_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.vercelManyProjects]: VERCEL_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation]: VERCEL_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.vercelBlocked]: VERCEL_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.vercelOptionalProjects]: VERCEL_OPTIONAL_PROJECTS_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.vercelAllProjects]: VERCEL_ALL_PROJECTS_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.vercelReconsentAllProjects]: VERCEL_OPTIONAL_PROJECTS_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.kemalBot]: KEMAL_BOT_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.kemalBotOrgWide]: KEMAL_BOT_ORG_WIDE_REQUEST,
  [OAUTH_APPS_MOCK_SCENARIOS.dynamicMcpClient]: DYNAMIC_MCP_CLIENT_REQUEST,
}

const NORTHWIND_TRADERS_DEVELOPER: OAuthOrganizationRole = {
  slug: 'northwind-traders',
  name: 'Northwind Traders',
  default_role: DEVELOPER_ROLE,
}

const NORTHWIND_TRADERS_READ_ONLY: OAuthOrganizationRole = {
  ...NORTHWIND_TRADERS_DEVELOPER,
  default_role: READ_ONLY_ROLE,
}

const CONTOSO_LABS: OAuthOrganizationRole = {
  slug: 'contoso-labs',
  name: 'Contoso Labs',
  default_role: OWNER_ROLE,
}

const TAILSPIN_TOYS_ADMIN: OAuthOrganizationRole = {
  slug: 'tailspin-toys',
  name: 'Tailspin Toys',
  default_role: ADMINISTRATOR_ROLE,
}

const FABRIKAM_OWNER: OAuthOrganizationRole = {
  slug: 'fabrikam-industries',
  name: 'Fabrikam Industries',
  default_role: OWNER_ROLE,
}

const WINGTIP_TOYS_DEVELOPER: OAuthOrganizationRole = {
  slug: 'wingtip-toys',
  name: 'Wingtip Toys',
  default_role: DEVELOPER_ROLE,
}

const LITWARE_DEVELOPER: OAuthOrganizationRole = {
  slug: 'litware-inc',
  name: 'Litware Inc.',
  default_role: DEVELOPER_ROLE,
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
    organizations: [TAILSPIN_TOYS_ADMIN, NORTHWIND_TRADERS_DEVELOPER],
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
  [OAUTH_APPS_MOCK_SCENARIOS.vercelBlocked]: {
    email: 'admin@example.com',
    organizations: [LITWARE_DEVELOPER, NORTHWIND_TRADERS_DEVELOPER],
  },
  [OAUTH_APPS_MOCK_SCENARIOS.vercelOptionalProjects]: {
    email: 'admin@example.com',
    organizations: [NORTHWIND_TRADERS_DEVELOPER, CONTOSO_LABS],
  },
  [OAUTH_APPS_MOCK_SCENARIOS.vercelAllProjects]: {
    email: 'admin@example.com',
    organizations: [NORTHWIND_TRADERS_READ_ONLY, CONTOSO_LABS, FABRIKAM_OWNER],
  },
  [OAUTH_APPS_MOCK_SCENARIOS.vercelReconsentAllProjects]: {
    email: 'admin@example.com',
    organizations: [TAILSPIN_TOYS_ADMIN, NORTHWIND_TRADERS_DEVELOPER],
  },
  [OAUTH_APPS_MOCK_SCENARIOS.kemalBot]: {
    email: 'admin@example.com',
    organizations: [NORTHWIND_TRADERS_DEVELOPER, CONTOSO_LABS],
  },
  [OAUTH_APPS_MOCK_SCENARIOS.kemalBotOrgWide]: {
    email: 'admin@example.com',
    organizations: [NORTHWIND_TRADERS_DEVELOPER, FABRIKAM_OWNER],
  },
  [OAUTH_APPS_MOCK_SCENARIOS.dynamicMcpClient]: {
    email: 'admin@example.com',
    organizations: [NORTHWIND_TRADERS_DEVELOPER, CONTOSO_LABS],
  },
}

const MOCK_ORGANIZATION_PROJECTS: Record<string, OAuthAppsAuthorizeOrganizationProject[]> = {
  'northwind-traders': [
    { ref: 'northwindstorefront1', name: 'northwind-storefront', role: ADMINISTRATOR_ROLE },
    { ref: 'northwindcms1', name: 'northwind-cms', role: DEVELOPER_ROLE },
    { ref: 'fabrikamapi1', name: 'fabrikam-api', role: READ_ONLY_ROLE },
    { ref: 'fabrikamjobs1', name: 'fabrikam-jobs', role: READ_ONLY_ROLE },
  ],
  'wingtip-toys': [
    { ref: 'wingtipweb1', name: 'wingtip-web', role: ADMINISTRATOR_ROLE },
    { ref: 'wingtipapi1', name: 'wingtip-api', role: DEVELOPER_ROLE },
    { ref: 'wingtipadmin1', name: 'wingtip-admin', role: DEVELOPER_ROLE },
    { ref: 'wingtipjobs1', name: 'wingtip-jobs', role: DEVELOPER_ROLE },
    { ref: 'wingtipsearch1', name: 'wingtip-search', role: READ_ONLY_ROLE },
    { ref: 'wingtipbilling1', name: 'wingtip-billing', role: ADMINISTRATOR_ROLE },
    { ref: 'wingtipmail1', name: 'wingtip-mail', role: DEVELOPER_ROLE },
    { ref: 'wingtipmedia1', name: 'wingtip-media', role: DEVELOPER_ROLE },
    { ref: 'wingtipmetrics1', name: 'wingtip-metrics', role: READ_ONLY_ROLE },
    { ref: 'wingtipstaging1', name: 'wingtip-staging', role: DEVELOPER_ROLE },
    { ref: 'wingtippreview1', name: 'wingtip-preview', role: DEVELOPER_ROLE },
    { ref: 'wingtipsandbox1', name: 'wingtip-sandbox', role: READ_ONLY_ROLE },
  ],
  'fabrikam-industries': [
    { ref: 'fabrikamledger1', name: 'fabrikam-ledger', role: ADMINISTRATOR_ROLE },
  ],
  'tailspin-toys': [
    { ref: 'tailspinshop1', name: 'tailspin-shop', role: ADMINISTRATOR_ROLE },
    { ref: 'tailspinwarehouse1', name: 'tailspin-warehouse', role: DEVELOPER_ROLE },
  ],
  'litware-inc': [{ ref: 'litwarecrm1', name: 'litware-crm', role: DEVELOPER_ROLE }],
  'contoso-labs': [],
}

const TAILSPIN_VERCEL_EXISTING_GRANT: OAuthExistingGrant = {
  approved_scopes: ['database:read', 'database:write', 'projects:read'],
  project_refs: ['tailspinshop1', 'tailspindeleted1'],
  approved_at: '2026-08-14T09:12:00.000Z',
}

const TAILSPIN_VERCEL_OPTIONAL_EXISTING_GRANT: OAuthExistingGrant = {
  approved_scopes: ['database:read', 'projects:read'],
  project_refs: [],
  approved_at: '2026-08-29T16:40:00.000Z',
}

const DEFAULT_ORG_APP_DETAILS: OAuthOrgAppDetails = {
  organization_settings: { require_project_scoping: false },
  blocked_reason: null,
  existing_grant: null,
}

const FABRIKAM_ORG_APP_DETAILS: OAuthOrgAppDetails = {
  organization_settings: { require_project_scoping: true },
  blocked_reason: null,
  existing_grant: null,
}

const MOCK_ORG_APP_DETAILS: Record<string, Record<string, OAuthOrgAppDetails>> = {
  'tailspin-toys': {
    vercel: { ...DEFAULT_ORG_APP_DETAILS, existing_grant: TAILSPIN_VERCEL_EXISTING_GRANT },
    'vercel-optional': {
      ...DEFAULT_ORG_APP_DETAILS,
      existing_grant: TAILSPIN_VERCEL_OPTIONAL_EXISTING_GRANT,
    },
  },
  'fabrikam-industries': {
    vercel: FABRIKAM_ORG_APP_DETAILS,
    'vercel-org-wide': {
      ...FABRIKAM_ORG_APP_DETAILS,
      blocked_reason: 'org_requires_project_scoping',
    },
    'kemal-bot-org-wide': {
      ...FABRIKAM_ORG_APP_DETAILS,
      blocked_reason: 'org_requires_project_scoping',
    },
  },
  'litware-inc': {
    vercel: { ...DEFAULT_ORG_APP_DETAILS, blocked_reason: 'app_blocked_for_organization' },
  },
}

const MOCK_APPS_OVERVIEW: ListOAuthAppsOverviewResponse = {
  data: [
    {
      id: 'vercel',
      name: 'Vercel',
      icon: null,
      status: 'active',
      member_grant_count: 33,
      last_used_at: '2026-09-16T08:12:00.000Z',
      org_grant: null,
    },
    {
      id: 'dynamic-mcp-client',
      name: 'Northwind MCP',
      icon: null,
      status: 'active',
      member_grant_count: 1,
      last_used_at: '2026-09-01T08:45:00.000Z',
      org_grant: null,
    },
    {
      id: 'contoso-analytics',
      name: 'Contoso Analytics',
      icon: null,
      status: 'legacy',
      member_grant_count: 0,
      last_used_at: '2026-07-02T10:00:00.000Z',
      org_grant: {
        grant_id: 'grant-contoso-analytics-org',
        approved_scopes: ['analytics:read', 'projects:read'],
        approved_at: '2025-11-03T14:20:00.000Z',
        last_used_at: '2026-07-02T10:00:00.000Z',
      },
    },
  ],
  pagination: { next_cursor: null },
}

const MOCK_BLOCKED_APPS: ListBlockedAppsResponse = {
  data: [
    {
      app_id: 'kemal-bot',
      name: 'kemal-bot',
      icon: null,
      blocked_at: '2026-09-10T15:30:00.000Z',
      blocked_by: { gotrue_id: 'b1d3e2f4-0000-4000-8000-000000000001', email: 'admin@example.com' },
    },
  ],
  pagination: { next_cursor: null },
}

const MOCK_APP_GRANTS: Record<string, ListAppGrantsResponse> = {
  vercel: {
    data: [
      {
        grant_id: 'grant-vercel-admin',
        kind: 'member_bound',
        user: {
          gotrue_id: 'b1d3e2f4-0000-4000-8000-000000000001',
          email: 'admin@example.com',
        },
        project_refs: ['northwindstorefront1', 'northwindcms1'],
        approved_scopes: ['database:read', 'database:write', 'projects:read'],
        approved_at: '2026-08-18T09:12:00.000Z',
        last_used_at: '2026-09-16T08:12:00.000Z',
      },
      {
        grant_id: 'grant-vercel-developer',
        kind: 'member_bound',
        user: {
          gotrue_id: 'b1d3e2f4-0000-4000-8000-000000000002',
          email: 'developer@example.com',
          avatar_url: 'https://avatars.example/developer.png',
        },
        project_refs: ['northwindcms1'],
        approved_scopes: ['projects:read'],
        approved_at: '2026-08-16T11:30:00.000Z',
        last_used_at: null,
      },
    ],
    pagination: { next_cursor: null },
  },
  'dynamic-mcp-client': {
    data: [
      {
        grant_id: 'grant-northwind-mcp-ops',
        kind: 'member_bound',
        user: {
          gotrue_id: 'b1d3e2f4-0000-4000-8000-000000000003',
          email: 'ops@example.com',
        },
        project_refs: ['northwindstorefront1'],
        approved_scopes: ['database:read', 'database:write'],
        approved_at: '2026-09-01T08:45:00.000Z',
        last_used_at: '2026-09-01T08:45:00.000Z',
      },
    ],
    pagination: { next_cursor: null },
  },
  'contoso-analytics': {
    data: [
      {
        grant_id: 'grant-contoso-analytics-org',
        kind: 'organization_bound',
        user: null,
        project_refs: null,
        approved_scopes: ['analytics:read', 'projects:read'],
        approved_at: '2025-11-03T14:20:00.000Z',
        last_used_at: '2026-07-02T10:00:00.000Z',
      },
    ],
    pagination: { next_cursor: null },
  },
}

export function getMockOAuthAppsOverview(): ListOAuthAppsOverviewResponse {
  return MOCK_APPS_OVERVIEW
}

export function getMockOAuthBlockedApps(): ListBlockedAppsResponse {
  return MOCK_BLOCKED_APPS
}

export function getMockOAuthAppGrants(appId: string): ListAppGrantsResponse {
  return MOCK_APP_GRANTS[appId] ?? { data: [], pagination: { next_cursor: null } }
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

export function getMockOAuthOrgAppDetails(slug: string, appId: string): OAuthOrgAppDetails {
  return MOCK_ORG_APP_DETAILS[slug]?.[appId] ?? DEFAULT_ORG_APP_DETAILS
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

const ROLE_VALIDATED_SCENARIOS = new Set<string>([
  OAUTH_APPS_MOCK_SCENARIOS.vercelRoleValidation,
  OAUTH_APPS_MOCK_SCENARIOS.vercelAllProjects,
])

const WRITE_SCOPE_LEVELS: OAuthScopeLevel[] = ['write', 'read_write']

function isReadOnlyRole(role: OrganizationRole) {
  return role.id === READ_ONLY_ROLE.id
}

export function getMockOAuthAppsAuthorizeApproveResult(
  authId: string,
  { slug, projectRefs }: { slug: string; projectRefs: string[] | undefined }
): OAuthAppsAuthorizeApproveResult {
  const approved = getMockOAuthAppsAuthorizeRedirect(authId, { approved: true })
  if (!ROLE_VALIDATED_SCENARIOS.has(authId)) return approved

  const failedScopes: OAuthScope[] = getMockOAuthAppsAuthorizeRequest(authId)
    .scopes.filter((scopeGroup) => WRITE_SCOPE_LEVELS.includes(scopeGroup.level))
    .flatMap((scopeGroup) => scopeGroup.scopes)
  if (failedScopes.length === 0) return approved

  if (projectRefs === undefined) {
    const organization = getMockOAuthAppsAuthorizeIdentity(authId).organizations.find(
      (candidate) => candidate.slug === slug
    )
    if (!organization || !isReadOnlyRole(organization.default_role)) return approved

    return {
      error_code: 'role_validation_failed',
      message: `Your ${organization.default_role.name} role cannot grant write access to this organization.`,
      validation: {
        scope_target: 'organization',
        role: organization.default_role,
        failed_scopes: failedScopes,
      },
    }
  }

  const blocked = getMockOAuthAppsAuthorizeOrganizationProjects(slug).filter(
    (project) => projectRefs.includes(project.ref) && isReadOnlyRole(project.role)
  )
  if (blocked.length === 0) return approved

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
