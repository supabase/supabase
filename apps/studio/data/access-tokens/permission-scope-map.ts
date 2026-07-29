import rawScopeMap from './permission-scope-map.json'

/**
 * Cross-reference between OpenFGA permission scopes, Management API endpoints, and MCP tools.
 *
 * TODO: replace with control-plane endpoint. This map is currently checked in as a static
 * snapshot generated from the mgmt-api OpenAPI specs + the MCP server tool list. Once the
 * control plane exposes a scope -> endpoints/tools endpoint, fetch it via a react-query hook
 * instead of importing this JSON.
 */

export interface ScopeMapEntry {
  endpoints: string[]
  mcp_tools: string[]
}

export interface PermissionScopeMap {
  _meta: Record<string, unknown>
  /** scope id -> the endpoints / MCP tools it (partially) authorizes */
  scopes: Record<string, ScopeMapEntry>
  /** endpoint -> ALL scopes it requires (conjunctive) */
  endpoints: Record<string, string[]>
  /** MCP tool -> ALL scopes it requires (conjunctive) */
  mcp_tools: Record<string, string[]>
}

export const PERMISSION_SCOPE_MAP = rawScopeMap as unknown as PermissionScopeMap

export interface EnabledEndpoint {
  /** HTTP method, e.g. "GET" */
  method: string
  /** Path, e.g. "/v1/projects/{ref}" */
  path: string
  /** The raw "METHOD /path" key */
  raw: string
}

const splitEndpoint = (raw: string): EnabledEndpoint => {
  const spaceIndex = raw.indexOf(' ')
  if (spaceIndex === -1) return { method: '', path: raw, raw }
  return { method: raw.slice(0, spaceIndex), path: raw.slice(spaceIndex + 1), raw }
}

/**
 * Given the set of granted scope ids, returns the Management API endpoints the token can call.
 * An endpoint is only enabled when ALL of its required scopes are granted (conjunctive), which is
 * how the mgmt-api `FgaPermissionsGuard` evaluates the `@AuthWithFgaPermissions` decorator.
 */
export const getEnabledEndpoints = (grantedScopes: Iterable<string>): EnabledEndpoint[] => {
  const granted = new Set(grantedScopes)
  return Object.entries(PERMISSION_SCOPE_MAP.endpoints)
    .filter(([, required]) => required.length > 0 && required.every((scope) => granted.has(scope)))
    .map(([raw]) => splitEndpoint(raw))
}

/**
 * Given the set of granted scope ids, returns the MCP tools the token can call. As with endpoints,
 * a tool is only enabled when ALL of its required scopes are granted.
 */
export const getEnabledMcpTools = (grantedScopes: Iterable<string>): string[] => {
  const granted = new Set(grantedScopes)
  return Object.entries(PERMISSION_SCOPE_MAP.mcp_tools)
    .filter(([, required]) => required.length > 0 && required.every((scope) => granted.has(scope)))
    .map(([tool]) => tool)
}

/**
 * Endpoints that (a) are fully satisfied by the complete granted-scope set AND (b) require at least
 * one of `capabilityScopes`. Used by the review step to group enabled endpoints under the capability
 * that contributes them, while still honouring dual-scope requirements (a dual-scope endpoint only
 * appears once all its scopes are granted, and shows under each contributing capability).
 */
export const getEnabledEndpointsForCapability = (
  capabilityScopes: Iterable<string>,
  allGrantedScopes: Iterable<string>
): EnabledEndpoint[] => {
  const granted = new Set(allGrantedScopes)
  const capability = new Set(capabilityScopes)
  return Object.entries(PERMISSION_SCOPE_MAP.endpoints)
    .filter(
      ([, required]) =>
        required.length > 0 &&
        required.every((scope) => granted.has(scope)) &&
        required.some((scope) => capability.has(scope))
    )
    .map(([raw]) => splitEndpoint(raw))
}

/**
 * Informational lookup for the per-permission risk tooltip: the MCP tools associated with any of
 * the given scopes. Unlike getEnabledMcpTools this is not conjunctive — it surfaces every tool that
 * lists one of these scopes, so users can see what a capability relates to before granting it.
 */
export const getMcpToolsForScopes = (scopeIds: Iterable<string>): string[] => {
  const tools = new Set<string>()
  for (const id of scopeIds) {
    PERMISSION_SCOPE_MAP.scopes[id]?.mcp_tools.forEach((tool) => tools.add(tool))
  }
  return Array.from(tools)
}
