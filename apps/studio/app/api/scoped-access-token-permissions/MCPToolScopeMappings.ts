import { constants, permissions } from '@supabase/shared-types'

import { McpMap } from '@/data/scoped-access-tokens/permission-scope-map-query'

const { OAuthScope } = constants

type OAuthScopeValue = (typeof OAuthScope)[keyof typeof OAuthScope]

// Manually extracted from platform mcp controller code. Each tool maps to alternative OAuth-scope
// groups with the same semantics as ScopeGroupAlternatives: a token can call the tool when it
// holds ALL scopes of at least ONE group (OR between groups, AND within a group). Most tools
// assert a single scope; execute_sql asserts database:read OR database:write depending on the
// session's read_only mode (mcp.controller.ts), so it carries two alternatives.
const MCPToolOAuthScopeMapping: Record<string, OAuthScopeValue[][]> = {
  apply_migration: [[OAuthScope.DATABASE_WRITE]],
  // Computes a local confirmation hash without calling the platform — no scope gates it.
  confirm_cost: [[]],
  create_branch: [[OAuthScope.ENVIRONMENT_WRITE]],
  create_project: [[OAuthScope.PROJECTS_WRITE]],
  delete_branch: [[OAuthScope.ENVIRONMENT_WRITE]],
  deploy_edge_function: [[OAuthScope.EDGE_FUNCTIONS_WRITE]],
  execute_sql: [[OAuthScope.DATABASE_READ], [OAuthScope.DATABASE_WRITE]],
  generate_typescript_types: [[OAuthScope.DATABASE_READ]],
  get_advisors: [[OAuthScope.DATABASE_READ]],
  // Calls getOrganization + listProjects to price a project, so it needs both read scopes.
  // (The type=branch path returns a constant with no platform call; gating on the project
  // path's scopes fails closed for branch-only pricing, which is fine for advisory display.)
  get_cost: [[OAuthScope.ORGANIZATIONS_READ, OAuthScope.PROJECTS_READ]],
  get_edge_function: [[OAuthScope.EDGE_FUNCTIONS_READ]],
  get_logs: [[OAuthScope.ANALYTICS_READ]],
  get_organization: [[OAuthScope.ORGANIZATIONS_READ]],
  get_project: [[OAuthScope.PROJECTS_READ]],
  get_project_url: [[OAuthScope.PROJECTS_READ]],
  get_publishable_keys: [[OAuthScope.SECRETS_READ]],
  get_storage_config: [[OAuthScope.STORAGE_READ]],
  list_branches: [[OAuthScope.ENVIRONMENT_READ]],
  list_edge_functions: [[OAuthScope.EDGE_FUNCTIONS_READ]],
  // Runs through executeSql with read_only forced true.
  list_extensions: [[OAuthScope.DATABASE_READ]],
  list_migrations: [[OAuthScope.DATABASE_READ]],
  list_organizations: [[OAuthScope.ORGANIZATIONS_READ]],
  list_projects: [[OAuthScope.PROJECTS_READ]],
  list_storage_buckets: [[OAuthScope.STORAGE_READ]],
  // Runs through executeSql with read_only forced true.
  list_tables: [[OAuthScope.DATABASE_READ]],
  merge_branch: [[OAuthScope.ENVIRONMENT_WRITE]],
  pause_project: [[OAuthScope.PROJECTS_WRITE]],
  rebase_branch: [[OAuthScope.ENVIRONMENT_WRITE]],
  reset_branch: [[OAuthScope.ENVIRONMENT_WRITE]],
  restore_project: [[OAuthScope.PROJECTS_WRITE]],
  // Queries the public content API — no scope gates it.
  search_docs: [[]],
  update_storage_config: [[OAuthScope.STORAGE_WRITE]],
}

type ExtractIds<T> = {
  [K in keyof T]: {
    [P in keyof T[K]]: T[K][P] extends { id: infer I } ? I : never
  }
}
const FGA_PERMISSIONS = Object.fromEntries(
  Object.entries(permissions.FgaPermissions).map(([group, permissions]) => [
    group,
    Object.fromEntries(Object.entries(permissions).map(([key, { id }]) => [key, id])),
  ])
) as ExtractIds<typeof permissions.FgaPermissions>

// Duplicated from platform (packages/api-core/src/lib/permissions/fga-permissions.ts)
// Ideally, this could be exported from @supabase/shared-types
export const legacyOauthScopeToFgaPermissionMap: Record<string, string[]> = {
  'analytics:read': [
    FGA_PERMISSIONS.PROJECT.ANALYTICS_LOGS_READ,
    FGA_PERMISSIONS.PROJECT.ANALYTICS_USAGE_READ,
  ],
  'analytics:write': [],
  'analytics_config:read': [FGA_PERMISSIONS.PROJECT.ANALYTICS_CONFIG_READ],
  'analytics_config:write': [FGA_PERMISSIONS.PROJECT.ANALYTICS_CONFIG_WRITE],
  'auth:read': [FGA_PERMISSIONS.PROJECT.AUTH_CONFIG_READ],
  // Note(Hieu) Auth:write scope grants access to all auth config endpoints.
  // However, one endpoint requires minimum administrator role, so this oauth scope must also include the FGA PROJECT.ADMIN_WRITE permission
  'auth:write': [FGA_PERMISSIONS.PROJECT.ADMIN_WRITE, FGA_PERMISSIONS.PROJECT.AUTH_CONFIG_WRITE],
  'database:read': [
    FGA_PERMISSIONS.USER.SNIPPETS_READ,
    FGA_PERMISSIONS.PROJECT.ADVISORS_READ,
    FGA_PERMISSIONS.PROJECT.BACKUPS_READ,
    FGA_PERMISSIONS.PROJECT.DATABASE_READ,
    FGA_PERMISSIONS.PROJECT.DATABASE_CONFIG_READ,
    FGA_PERMISSIONS.PROJECT.DATABASE_JIT_READ,
    FGA_PERMISSIONS.PROJECT.DATABASE_MIGRATIONS_READ,
    FGA_PERMISSIONS.PROJECT.DATABASE_POOLING_CONFIG_READ,
    FGA_PERMISSIONS.PROJECT.DATABASE_READONLY_CONFIG_READ,
    FGA_PERMISSIONS.PROJECT.DATABASE_SSL_CONFIG_READ,
    FGA_PERMISSIONS.PROJECT.SNIPPETS_READ,
  ],
  'database:write': [
    FGA_PERMISSIONS.PROJECT.ADMIN_WRITE,
    FGA_PERMISSIONS.PROJECT.BACKUPS_WRITE,
    // Note(Hieu): Include database read permission here to align with the project query endpoint.
    // RLS and FGA guard this endpoint with database read first, then perform an additional check for write queries.
    // The OAuth guard requires database write directly, which causes a discrepancy error if we don't include read here.
    FGA_PERMISSIONS.PROJECT.DATABASE_READ,
    FGA_PERMISSIONS.PROJECT.DATABASE_WRITE,
    FGA_PERMISSIONS.PROJECT.DATABASE_CONFIG_WRITE,
    FGA_PERMISSIONS.PROJECT.DATABASE_MIGRATIONS_WRITE,
    FGA_PERMISSIONS.PROJECT.DATABASE_POOLING_CONFIG_WRITE,
    FGA_PERMISSIONS.PROJECT.DATABASE_READONLY_CONFIG_WRITE,
    FGA_PERMISSIONS.PROJECT.DATABASE_SSL_CONFIG_WRITE,
    FGA_PERMISSIONS.PROJECT.DATABASE_WEBHOOKS_CONFIG_WRITE,
  ],
  'domains:read': [
    FGA_PERMISSIONS.PROJECT.CUSTOM_DOMAIN_READ,
    FGA_PERMISSIONS.PROJECT.VANITY_SUBDOMAIN_READ,
  ],
  'domains:write': [
    FGA_PERMISSIONS.PROJECT.CUSTOM_DOMAIN_WRITE,
    FGA_PERMISSIONS.PROJECT.VANITY_SUBDOMAIN_WRITE,
  ],
  'edge_functions:read': [FGA_PERMISSIONS.PROJECT.EDGE_FUNCTIONS_READ],
  'edge_functions:write': [FGA_PERMISSIONS.PROJECT.EDGE_FUNCTIONS_WRITE],
  'environment:read': [
    FGA_PERMISSIONS.PROJECT.ACTION_RUNS_READ,
    FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_READ,
    FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_READ,
  ],
  'environment:write': [
    FGA_PERMISSIONS.PROJECT.ACTION_RUNS_WRITE,
    FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_CREATE,
    FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_DELETE,
    FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_WRITE,
    FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_CREATE,
    FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_DELETE,
    FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_WRITE,
  ],
  'organizations:read': [
    FGA_PERMISSIONS.USER.ORGANIZATIONS_READ,
    FGA_PERMISSIONS.ORGANIZATION.ADMIN_READ,
    FGA_PERMISSIONS.ORGANIZATION.MEMBERS_READ,
  ],
  'organizations:write': [],
  'projects:read': [
    FGA_PERMISSIONS.USER.PROJECTS_READ,
    FGA_PERMISSIONS.ORGANIZATION.PROJECTS_READ,
    FGA_PERMISSIONS.PROJECT.ADMIN_READ,
    FGA_PERMISSIONS.PROJECT.DATABASE_NETWORK_BANS_READ,
    FGA_PERMISSIONS.PROJECT.DATABASE_NETWORK_RESTRICTIONS_READ,
  ],
  'projects:write': [
    FGA_PERMISSIONS.ORGANIZATION.ADMIN_WRITE,
    FGA_PERMISSIONS.ORGANIZATION.PROJECTS_CREATE,
    FGA_PERMISSIONS.PROJECT.ADMIN_WRITE,
    FGA_PERMISSIONS.PROJECT.DATABASE_NETWORK_BANS_WRITE,
    FGA_PERMISSIONS.PROJECT.DATABASE_NETWORK_RESTRICTIONS_WRITE,
  ],
  'rest:read': [FGA_PERMISSIONS.PROJECT.DATA_API_CONFIG_READ],
  'rest:write': [FGA_PERMISSIONS.PROJECT.DATA_API_CONFIG_WRITE],
  'secrets:read': [
    FGA_PERMISSIONS.PROJECT.API_GATEWAY_KEYS_READ,
    FGA_PERMISSIONS.PROJECT.AUTH_SIGNING_KEYS_READ,
    FGA_PERMISSIONS.PROJECT.EDGE_FUNCTIONS_SECRETS_READ,
  ],
  'secrets:write': [
    FGA_PERMISSIONS.PROJECT.API_GATEWAY_KEYS_WRITE,
    FGA_PERMISSIONS.PROJECT.AUTH_SIGNING_KEYS_WRITE,
    FGA_PERMISSIONS.PROJECT.EDGE_FUNCTIONS_SECRETS_WRITE,
  ],
  'storage:read': [
    FGA_PERMISSIONS.PROJECT.STORAGE_READ,
    FGA_PERMISSIONS.PROJECT.STORAGE_CONFIG_READ,
  ],
  'storage:write': [
    FGA_PERMISSIONS.PROJECT.STORAGE_WRITE,
    FGA_PERMISSIONS.PROJECT.STORAGE_CONFIG_WRITE,
  ],
}

/*
 * Build a map of MCP tools/FGA permissions by expanding each OAuth-scope group to the FGA
 * permissions it implies:
 * {
 *    execute_sql: [["snippets_read", "database_read", ...], ["project_admin_write", ...]]
 * }
 * Groups are expanded independently, preserving the OR-of-AND structure. A group is an AND, so it
 * is kept only when every one of its scopes maps to at least one FGA permission — a partial
 * expansion would weaken the requirement (e.g. [ORGANIZATIONS_READ, PROJECTS_READ] shrinking to
 * projects_read alone). A group with any unmapped scope is dropped whole, so the tool stays gated
 * rather than becoming ungated; an explicitly empty group ([]) is the deliberate ungated marker
 * and is vacuously kept.
 * The code is duplicated from platform until we find a better way to share those mappings
 */
export const expandOAuthScopeGroups = (
  oAuthScopeGroups: string[][],
  fgaPermissionMap: Record<string, string[]>
): string[][] =>
  oAuthScopeGroups
    .filter((group) => group.every((oAuthScope) => (fgaPermissionMap[oAuthScope] ?? []).length > 0))
    .map((group) => group.flatMap((oAuthScope) => fgaPermissionMap[oAuthScope] ?? []))

export const MCPToolScopeMappings = Object.entries(MCPToolOAuthScopeMapping).reduce(
  (acc, [mcpTool, oAuthScopeGroups]) => {
    acc[mcpTool] = expandOAuthScopeGroups(oAuthScopeGroups, legacyOauthScopeToFgaPermissionMap)
    return acc
  },
  {} as McpMap
)
