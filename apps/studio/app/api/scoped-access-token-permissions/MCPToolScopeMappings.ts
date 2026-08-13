import { permissions } from '@supabase/shared-types'

import { McpMap } from '@/data/scoped-access-tokens/permission-scope-map-query'

type ExtractIds<T> = {
  [K in keyof T]: {
    [P in keyof T[K]]: T[K][P] extends { id: infer I } ? I : never
  }
}
const FGA_PERMISSIONS = Object.fromEntries(
  Object.entries(permissions.FgaPermissions).map(([group, groupPermissions]) => [
    group,
    Object.fromEntries(Object.entries(groupPermissions).map(([key, { id }]) => [key, id])),
  ])
) as ExtractIds<typeof permissions.FgaPermissions>

/*
 * Transcribed directly from platform's MCP controller (mcp.controller.ts, the
 * @supabase/mcp-server-supabase@0.8.1 version the platform pins): each tool's
 * `assertFgaPermissions([...])` call(s). This is the actual runtime gate for MCP tool calls, and it
 * is NOT always the same as the equivalent REST endpoint's `x-fga-permissions` annotation — see
 * create_branch and get_cost below, where the two diverge — so it must be hand-maintained against
 * the controller source rather than derived from the OpenAPI spec.
 *
 * Update this whenever the platform bumps @supabase/mcp-server-supabase or changes
 * mcp.controller.ts.
 */
export const MCPToolScopeMappings: McpMap = {
  // --- account ---
  list_organizations: [[FGA_PERMISSIONS.USER.ORGANIZATIONS_READ]],
  get_organization: [[FGA_PERMISSIONS.ORGANIZATION.ADMIN_READ]],
  list_projects: [[FGA_PERMISSIONS.USER.PROJECTS_READ]],
  get_project: [[FGA_PERMISSIONS.PROJECT.ADMIN_READ]],
  create_project: [[FGA_PERMISSIONS.ORGANIZATION.PROJECTS_CREATE]],
  pause_project: [[FGA_PERMISSIONS.PROJECT.ADMIN_WRITE]],
  restore_project: [[FGA_PERMISSIONS.PROJECT.ADMIN_WRITE]],

  // --- branching ---
  // listBranches has no direct assertFgaPermissions call (uses getBranchReadAccess instead), but
  // requires at least development or production read, matching the v1 list-branches gate.
  list_branches: [
    [FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_READ],
    [FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_READ],
  ],
  // createBranch always creates a development branch, so — unlike the REST endpoint's annotation,
  // which also offers a production-create alternative — only development create gates it.
  create_branch: [[FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_CREATE]],
  // delete/merge/reset/rebase all check whichever of development/production the target branch
  // actually is (assertBranchFgaPermission), so both alternatives are offered.
  delete_branch: [
    [FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_DELETE],
    [FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_DELETE],
  ],
  merge_branch: [
    [FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_WRITE],
    [FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_WRITE],
  ],
  reset_branch: [
    [FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_WRITE],
    [FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_WRITE],
  ],
  // Implemented via pushBranch, same dev/prod write check as merge/reset.
  rebase_branch: [
    [FGA_PERMISSIONS.PROJECT.BRANCHING_DEVELOPMENT_WRITE],
    [FGA_PERMISSIONS.PROJECT.BRANCHING_PRODUCTION_WRITE],
  ],

  // --- database ---
  // The controller's outer gate is DATABASE_READ for every call, read or write; writes are
  // additionally gated by DATABASE_WRITE deeper inside executeProjectDatabaseQuery. Since this UI
  // never grants database_write without database_read, one database_read group covers both.
  execute_sql: [[FGA_PERMISSIONS.PROJECT.DATABASE_READ]],
  // Both run through executeSql with read_only forced true, so they gate the same as execute_sql.
  list_extensions: [[FGA_PERMISSIONS.PROJECT.DATABASE_READ]],
  list_tables: [[FGA_PERMISSIONS.PROJECT.DATABASE_READ]],
  list_migrations: [[FGA_PERMISSIONS.PROJECT.DATABASE_MIGRATIONS_READ]],
  apply_migration: [[FGA_PERMISSIONS.PROJECT.DATABASE_MIGRATIONS_WRITE]],

  // --- debugging ---
  get_logs: [[FGA_PERMISSIONS.PROJECT.ANALYTICS_LOGS_READ]],
  // Security and performance advisors are gated identically.
  get_advisors: [[FGA_PERMISSIONS.PROJECT.ADVISORS_READ]],

  // --- development ---
  generate_typescript_types: [[FGA_PERMISSIONS.PROJECT.DATABASE_READ]],
  get_project_url: [[FGA_PERMISSIONS.PROJECT.ADMIN_READ]],
  get_publishable_keys: [[FGA_PERMISSIONS.PROJECT.API_GATEWAY_KEYS_READ]],

  // --- functions ---
  list_edge_functions: [[FGA_PERMISSIONS.PROJECT.EDGE_FUNCTIONS_READ]],
  get_edge_function: [[FGA_PERMISSIONS.PROJECT.EDGE_FUNCTIONS_READ]],
  deploy_edge_function: [[FGA_PERMISSIONS.PROJECT.EDGE_FUNCTIONS_WRITE]],

  // --- storage ---
  get_storage_config: [[FGA_PERMISSIONS.PROJECT.STORAGE_CONFIG_READ]],
  update_storage_config: [[FGA_PERMISSIONS.PROJECT.STORAGE_CONFIG_WRITE]],
  list_storage_buckets: [[FGA_PERMISSIONS.PROJECT.STORAGE_READ]],

  // --- built by the mcp-server-supabase package on top of the platform primitives above, not its
  //     own controller assertion ---
  // Calls getOrganization (ORGANIZATION.ADMIN_READ) + listProjects (USER.PROJECTS_READ) to price a
  // project, and needs both together.
  get_cost: [[FGA_PERMISSIONS.ORGANIZATION.ADMIN_READ, FGA_PERMISSIONS.USER.PROJECTS_READ]],

  // Computes a local confirmation hash without calling the platform — no gate.
  confirm_cost: [[]],
  // Queries the public content API — no gate.
  search_docs: [[]],
}
