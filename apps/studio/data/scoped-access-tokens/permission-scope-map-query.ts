import { useQuery } from '@tanstack/react-query'

import { scopedAccessTokenKeys } from './keys'
import { BASE_PATH } from '@/lib/constants'
import { ResponseError } from '@/types'

/**
 * Cross-reference between OpenFGA permission scopes, Management API endpoints, and MCP tools.
 */

export interface ScopeMapEntry {
  endpoints: string[]
  mcp_tools: string[]
}

/* e.g
  {
    "branching_production_read": {
      "endpoints": [
          "GET /v1/branches/{branch_id_or_ref}",
          "GET /v1/projects/{ref}/branches",
          "GET /v1/projects/{ref}/branches/{name}"
      ],
      "mcp_tools": [
          "list_branches"
      ]
    }
  }
*/
export type ScopeMap = Record<string, ScopeMapEntry>
// e.g { 'GET /v2/projects/{ref}/analytics/log-drains': ['analytics_config_read'] }
export type EndpointMap = Record<string, string[]>
// e.g { 'deploy_edge_function': ['edge_functions_write'] }
export type McpMap = Record<string, string[]>

export interface PermissionScopeMap {
  /** scope id -> the endpoints / MCP tools it (partially) authorizes */
  scopes: ScopeMap
  /** endpoint -> ALL scopes it requires (conjunctive) */
  endpoints: EndpointMap
  /** MCP tool -> ALL scopes it requires (conjunctive) */
  mcp_tools: McpMap
}

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
export const getEnabledEndpoints = ({
  grantedScopes,
  permissionScopeMap,
}: {
  grantedScopes: Iterable<string>
  permissionScopeMap: PermissionScopeMap | undefined
}): EnabledEndpoint[] => {
  if (permissionScopeMap == null) return []

  const granted = new Set(grantedScopes)
  return Object.entries(permissionScopeMap.endpoints)
    .filter(([, required]) => required.length > 0 && required.every((scope) => granted.has(scope)))
    .map(([raw]) => splitEndpoint(raw))
}

/**
 * Given the set of granted scope ids, returns the MCP tools the token can call. As with endpoints,
 * a tool is only enabled when ALL of its required scopes are granted.
 */
export const getEnabledMcpTools = ({
  grantedScopes,
  permissionScopeMap,
}: {
  grantedScopes: Iterable<string>
  permissionScopeMap: PermissionScopeMap | undefined
}): string[] => {
  if (permissionScopeMap == null) return []

  const granted = new Set(grantedScopes)
  return Object.entries(permissionScopeMap.mcp_tools)
    .filter(([, required]) => required.length > 0 && required.every((scope) => granted.has(scope)))
    .map(([tool]) => tool)
}

/**
 * Endpoints that (a) are fully satisfied by the complete granted-scope set AND (b) require at least
 * one of `capabilityScopes`. Used by the review step to group enabled endpoints under the capability
 * that contributes them, while still honouring dual-scope requirements (a dual-scope endpoint only
 * appears once all its scopes are granted, and shows under each contributing capability).
 */
export const getEnabledEndpointsForCapability = ({
  capabilityScopes,
  allGrantedScopes,
  permissionScopeMap,
}: {
  capabilityScopes: Iterable<string>
  allGrantedScopes: Iterable<string>
  permissionScopeMap: PermissionScopeMap | undefined
}): EnabledEndpoint[] => {
  if (permissionScopeMap == null) return []

  const granted = new Set(allGrantedScopes)
  const capability = new Set(capabilityScopes)
  return Object.entries(permissionScopeMap.endpoints)
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
export const getMcpToolsForScopes = ({
  scopeIds,
  permissionScopeMap,
}: {
  scopeIds: Iterable<string>
  permissionScopeMap: PermissionScopeMap | undefined
}): string[] => {
  if (permissionScopeMap == null) return []

  const tools = new Set<string>()
  for (const id of scopeIds) {
    permissionScopeMap.scopes[id]?.mcp_tools.forEach((tool) => tools.add(tool))
  }
  return Array.from(tools)
}

export async function getGetScopedTokenPermissionsForScope(signal?: AbortSignal) {
  const response = await fetch(`${BASE_PATH}/api/scoped-access-token-permissions`, {
    signal,
    method: 'GET',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[getIncidentStatus] Failed:', response.status, errorText)

    let retryAfter: number | undefined
    const retryAfterHeader = response.headers.get('Retry-After')
    if (retryAfterHeader !== null) {
      const parsed = Number(retryAfterHeader)
      if (Number.isFinite(parsed) && parsed > 0) retryAfter = parsed
    }

    throw new ResponseError(
      `Failed to fetch incident status: ${response.statusText}`,
      response.status,
      undefined,
      retryAfter
    )
  }

  return await response.json()
}

export type ScopedAccessTokenPermissionsForScopeError = ResponseError

export const useGetEnabledEndpointsForCapability = <TData = PermissionScopeMap>() => {
  return useQuery<TData, ScopedAccessTokenPermissionsForScopeError, TData>({
    queryKey: scopedAccessTokenKeys.permissions(),
    queryFn: ({ signal }) => getGetScopedTokenPermissionsForScope(signal),
  })
}
