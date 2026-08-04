import { permissions } from '@supabase/shared-types'

import { McpMap } from '@/data/scoped-access-tokens/permission-scope-map-query'

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

const { USER, ORGANIZATION, PROJECT } = FGA_PERMISSIONS

/**
 * MCP tool -> the FGA permissions a scoped token needs to call it.
 *
 * Each entry is derived from the Management API endpoint(s) the tool's handler actually calls, and
 * the groups are copied verbatim from that endpoint's `x-fga-permissions` — the same annotation the
 * endpoint half of this map is built from. The comment above each entry names the endpoint so the
 * whole map can be re-audited against `${NEXT_PUBLIC_API_DOMAIN}/api/v1-json` in one pass. Comment
 * paths follow the spec's parameter names; the pinned client's generated types may use older names
 * for the same routes (its `{branch_id}` is the spec's `{branch_id_or_ref}`).
 *
 * Why not the platform MCP controller's `assertMcpOAuthScope` calls: those assert coarse OAuth
 * scope bundles ('database:read' covers advisors, backups, migrations, snippets, …) and are no-ops
 * for personal access tokens. Expanding a bundle into its FGA permissions produces a conjunction of
 * everything in it, which demands permissions the tool never uses and hides the tool from tokens
 * that can genuinely call it. The endpoint's own FGA annotation is what the guard enforces for a
 * scoped token, so that is what we mirror.
 *
 * SCOPE: this describes the MCP server that calls the Management API with the token — the
 * `@supabase/mcp-server-supabase` package, whose `src/platform/api-platform.ts` maps every tool to
 * a v1 endpoint. It does NOT describe the platform-hosted MCP endpoint (`/mcp` in the mgmt-api),
 * which reimplements the same tools with its own authorization and currently rejects scoped PATs
 * outright, pending a migration to FGA permission checks. Revisit this file if that lands, since
 * the hosted checks do not all match the endpoint ones.
 *
 * `[[]]` — a single empty group — marks a tool that no permission gates, because its handler makes
 * no Management API call. See `ScopeGroupAlternatives` for why that, and not `[]`, is "ungated".
 *
 * The tool list is pinned to the installed @supabase/mcp-server-supabase by a test that diffs these
 * keys against its registry, so a dependency bump that adds or drops a tool fails CI by name.
 */
export const MCPToolScopeMappings: McpMap = {
  // GET /v1/organizations
  list_organizations: [[USER.ORGANIZATIONS_READ]],
  // GET /v1/organizations/{slug}
  get_organization: [[ORGANIZATION.ADMIN_READ]],
  // GET /v1/projects
  list_projects: [[USER.PROJECTS_READ]],
  // GET /v1/projects/{ref}
  get_project: [[PROJECT.ADMIN_READ]],
  // `type: 'branch'` returns a local constant and needs no permission. The `type: 'project'` path
  // additionally calls GET /v1/organizations/{slug} and GET /v1/projects, but this tool-level map
  // records the least-privileged useful invocation, consistent with execute_sql below.
  get_cost: [[]],
  // Hashes the cost object locally, no Management API call
  confirm_cost: [[]],
  // The cost flow above, then POST /v1/projects
  create_project: [[ORGANIZATION.ADMIN_READ, USER.PROJECTS_READ, ORGANIZATION.PROJECTS_CREATE]],
  // POST /v1/projects/{ref}/pause
  pause_project: [[PROJECT.ADMIN_WRITE]],
  // POST /v1/projects/{ref}/restore
  restore_project: [[PROJECT.ADMIN_WRITE]],

  // POST /v1/projects/{ref}/database/query. The spec annotates this
  // `[[database_read], [database_write]]`, but those are NOT alternatives: the route uses
  // `AuthWithFgaPermissions([DATABASE_READ], [[DATABASE_WRITE]])`, so the guard requires
  // database_read and database_write is a doc-only group. A write query without database_write is
  // downgraded to a read-only connection rather than rejected, so read alone is the real
  // requirement to call the tool.
  execute_sql: [[PROJECT.DATABASE_READ]],
  // POST /v1/projects/{ref}/database/query with read_only: true
  list_tables: [[PROJECT.DATABASE_READ]],
  // POST /v1/projects/{ref}/database/query with read_only: true
  list_extensions: [[PROJECT.DATABASE_READ]],
  // GET /v1/projects/{ref}/database/migrations
  list_migrations: [[PROJECT.DATABASE_MIGRATIONS_READ]],
  // POST /v1/projects/{ref}/database/migrations
  apply_migration: [[PROJECT.DATABASE_MIGRATIONS_WRITE]],

  // GET /v1/projects/{ref}/analytics/endpoints/logs.all
  get_logs: [[PROJECT.ANALYTICS_LOGS_READ]],
  // GET /v1/projects/{ref}/advisors/security and /advisors/performance (one tool, `type` param)
  get_advisors: [[PROJECT.ADVISORS_READ]],

  // Builds the URL from the project ref and API hostname, no Management API call
  get_project_url: [[]],
  // GET /v1/projects/{ref}/api-keys, plus /api-keys/legacy — both api_gateway_keys_read
  get_publishable_keys: [[PROJECT.API_GATEWAY_KEYS_READ]],
  // GET /v1/projects/{ref}/types/typescript
  generate_typescript_types: [[PROJECT.DATABASE_READ]],

  // GET /v1/projects/{ref}/functions
  list_edge_functions: [[PROJECT.EDGE_FUNCTIONS_READ]],
  // GET /v1/projects/{ref}/functions/{function_slug} and /body
  get_edge_function: [[PROJECT.EDGE_FUNCTIONS_READ]],
  // POST /v1/projects/{ref}/functions/deploy. It first tries to read the existing function to reuse
  // its import map, but that call is wrapped in try/catch, so read is not actually required.
  deploy_edge_function: [[PROJECT.EDGE_FUNCTIONS_WRITE]],

  // POST /v1/projects/{ref}/branches. The MCP client never sends `is_default`, so the endpoint
  // always checks the development-create permission for this tool.
  create_branch: [[PROJECT.BRANCHING_DEVELOPMENT_CREATE]],
  // GET /v1/projects/{ref}/branches
  list_branches: [[PROJECT.BRANCHING_DEVELOPMENT_READ], [PROJECT.BRANCHING_PRODUCTION_READ]],
  // For the four branch-id endpoints below, the handler checks exactly ONE of the two groups at
  // runtime, keyed on the target branch's `is_default` (production when true, development
  // otherwise) — so the OR is "either alternative unlocks some invocations", not a fallback. A
  // development-only token still gets a 403 when targeting the default branch, and vice versa.
  // DELETE /v1/branches/{branch_id_or_ref}
  delete_branch: [[PROJECT.BRANCHING_DEVELOPMENT_DELETE], [PROJECT.BRANCHING_PRODUCTION_DELETE]],
  // POST /v1/branches/{branch_id_or_ref}/merge
  merge_branch: [[PROJECT.BRANCHING_DEVELOPMENT_WRITE], [PROJECT.BRANCHING_PRODUCTION_WRITE]],
  // POST /v1/branches/{branch_id_or_ref}/reset
  reset_branch: [[PROJECT.BRANCHING_DEVELOPMENT_WRITE], [PROJECT.BRANCHING_PRODUCTION_WRITE]],
  // POST /v1/branches/{branch_id_or_ref}/push
  rebase_branch: [[PROJECT.BRANCHING_DEVELOPMENT_WRITE], [PROJECT.BRANCHING_PRODUCTION_WRITE]],

  // Content API lookup, no Management API call
  search_docs: [[]],
  // GET /v1/projects/{ref}/storage/buckets
  list_storage_buckets: [[PROJECT.STORAGE_READ]],
  // GET /v1/projects/{ref}/config/storage
  get_storage_config: [[PROJECT.STORAGE_CONFIG_READ]],
  // PATCH /v1/projects/{ref}/config/storage
  update_storage_config: [[PROJECT.STORAGE_CONFIG_WRITE]],
}
