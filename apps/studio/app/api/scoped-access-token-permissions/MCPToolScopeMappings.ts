import {
  EndpointMap,
  McpMap,
  ScopeGroupAlternatives,
} from '@/data/scoped-access-tokens/permission-scope-map-query'

/*
 * Manually extracted from platform mcp controller code: the exact tool registry of
 * @supabase/mcp-server-supabase@0.8.1, the version the platform pins. Each tool maps to alternative
 * groups of Management API endpoints — a token can use the tool when it holds every scope required
 * by at least one alternative's endpoints (OR between alternatives, AND across the endpoints within
 * one), mirroring the ScopeGroupAlternatives semantics.
 *
 * Deriving a tool's requirement from the endpoint(s) it actually calls — rather than hand-picking
 * scopes — means the requirement can never drift from what those endpoints enforce; only this
 * endpoint list needs maintaining when the mcp-server version changes.
 */
export const MCPToolEndpointMapping: Record<string, string[][]> = {
  apply_migration: [['POST /v1/projects/{ref}/database/migrations']],
  // Computes a local confirmation hash without calling the platform — no endpoint, so no gate.
  confirm_cost: [[]],
  create_branch: [['POST /v1/projects/{ref}/branches']],
  create_project: [['POST /v1/projects']],
  delete_branch: [['DELETE /v1/branches/{branch_id_or_ref}']],
  deploy_edge_function: [['POST /v1/projects/{ref}/functions/deploy']],
  execute_sql: [['POST /v1/projects/{ref}/database/query']],
  generate_typescript_types: [['GET /v1/projects/{ref}/types/typescript']],
  get_advisors: [['GET /v1/projects/{ref}/advisors/security']],
  // Calls getOrganization + the org-scoped listProjects to price a project, so it needs both.
  get_cost: [['GET /v1/organizations/{slug}', 'GET /v1/organizations/{slug}/projects']],
  get_edge_function: [['GET /v1/projects/{ref}/functions/{function_slug}']],
  get_logs: [['GET /v1/projects/{ref}/analytics/endpoints/logs.all']],
  get_organization: [['GET /v1/organizations/{slug}']],
  get_project: [['GET /v1/projects/{ref}']],
  get_project_url: [['GET /v1/projects/{ref}']],
  get_publishable_keys: [['GET /v1/projects/{ref}/api-keys']],
  get_storage_config: [['GET /v1/projects/{ref}/config/storage']],
  list_branches: [['GET /v1/projects/{ref}/branches']],
  list_edge_functions: [['GET /v1/projects/{ref}/functions']],
  // Runs through the read-only query endpoint (read_only forced true), not the general one.
  list_extensions: [['POST /v1/projects/{ref}/database/query/read-only']],
  list_migrations: [['GET /v1/projects/{ref}/database/migrations']],
  list_organizations: [['GET /v1/organizations']],
  list_projects: [['GET /v1/projects']],
  list_storage_buckets: [['GET /v1/projects/{ref}/storage/buckets']],
  // Runs through the read-only query endpoint (read_only forced true), not the general one.
  list_tables: [['POST /v1/projects/{ref}/database/query/read-only']],
  merge_branch: [['POST /v1/branches/{branch_id_or_ref}/merge']],
  pause_project: [['POST /v1/projects/{ref}/pause']],
  rebase_branch: [['POST /v1/branches/{branch_id_or_ref}/push']],
  reset_branch: [['POST /v1/branches/{branch_id_or_ref}/reset']],
  restore_project: [['POST /v1/projects/{ref}/restore']],
  // Queries the public content API — no endpoint, so no gate.
  search_docs: [[]],
  update_storage_config: [['PATCH /v1/projects/{ref}/config/storage']],
}

/*
 * Combines two ScopeGroupAlternatives with logical AND: every alternative of `a` paired with every
 * alternative of `b`, preserving DNF (OR between alternatives, AND within a pair). An empty input —
 * no alternatives, the "satisfied by nobody" marker — makes the combination unsatisfiable too, which
 * is how a tool loses a whole alternative when one of its endpoints isn't found in the fetched spec,
 * rather than silently dropping just that endpoint's contribution.
 */
const andCombine = (
  a: ScopeGroupAlternatives,
  b: ScopeGroupAlternatives
): ScopeGroupAlternatives => {
  if (a.length === 0 || b.length === 0) return []
  const combined: ScopeGroupAlternatives = []
  for (const groupA of a) {
    for (const groupB of b) {
      combined.push(Array.from(new Set([...groupA, ...groupB])))
    }
  }
  return combined
}

/*
 * Resolves one alternative's endpoint keys against the live endpoints map, ANDing together the
 * scope groups each endpoint is annotated with. Folding starts from `[[]]` — one empty group, the
 * AND-identity — so an alternative with no endpoints (confirm_cost, search_docs) resolves to `[[]]`
 * (ungated) rather than `[]` (unsatisfiable).
 */
const resolveAlternative = (
  endpointKeys: string[],
  endpoints: EndpointMap
): ScopeGroupAlternatives =>
  endpointKeys.reduce((acc, key) => andCombine(acc, endpoints[key] ?? []), [
    [],
  ] as ScopeGroupAlternatives)

/**
 * Builds the MCP tool -> scope-group map by resolving MCPToolEndpointMapping against the endpoints
 * actually indexed from the fetched OpenAPI specs, so a tool's requirement is always exactly what
 * its backing endpoint(s) enforce.
 */
export const buildMcpToolScopeMap = (endpoints: EndpointMap): McpMap =>
  Object.fromEntries(
    Object.entries(MCPToolEndpointMapping).map(([tool, alternatives]) => [
      tool,
      alternatives.flatMap((endpointKeys) => resolveAlternative(endpointKeys, endpoints)),
    ])
  )
