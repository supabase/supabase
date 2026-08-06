import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

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

/** A set of scopes that must ALL be granted (conjunctive). */
export type ScopeGroup = string[]
/**
 * Alternative scope groups, mirroring the mgmt-api `x-fga-permissions` semantics: a token satisfies
 * the requirement when it holds ALL scopes of at least ONE group — OR between groups, AND within a
 * group. `GET /v1/projects/{ref}/branches` is annotated
 * `[['branching_development_read'], ['branching_production_read']]`, and either alternative alone
 * authorizes the call.
 *
 * Standard disjunctive-normal-form semantics apply at the edges, so no special cases are needed:
 * `[[]]` — one empty group — is satisfied by every token (an empty AND is true), which is how MCP
 * tools that make no Management API call are recorded. `[]` — no alternatives at all — is satisfied
 * by nobody (an empty OR is false), so an item that somehow loses its groups is hidden rather than
 * advertised to everyone.
 */
export type ScopeGroupAlternatives = ScopeGroup[]

// e.g { 'GET /v1/projects/{ref}/branches': [['branching_development_read'], ['branching_production_read']] }
export type EndpointMap = Record<string, ScopeGroupAlternatives>
// e.g { 'deploy_edge_function': [['edge_functions_write']] }
export type McpMap = Record<string, ScopeGroupAlternatives>

export interface PermissionScopeMap {
  /** scope id -> the endpoints / MCP tools it (partially) authorizes */
  scopes: ScopeMap
  /** endpoint -> alternative scope groups (OR between groups, AND within a group) */
  endpoints: EndpointMap
  /** MCP tool -> alternative scope groups (OR between groups, AND within a group) */
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

// Plain disjunctive-normal-form evaluation: some group where every scope is granted. An empty
// group is vacuously satisfied, which is exactly what "nothing gates this" should mean.
const isSatisfied = (groups: ScopeGroupAlternatives, granted: Set<string>) =>
  groups.some((group) => group.every((scope) => granted.has(scope)))

/**
 * Given the set of granted scope ids, returns the Management API endpoints the token can call.
 * An endpoint is enabled when ALL scopes of at least ONE of its alternative groups are granted,
 * matching the `x-fga-permissions` contract described on `ScopeGroupAlternatives`.
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
    .filter(([, groups]) => isSatisfied(groups, granted))
    .map(([raw]) => splitEndpoint(raw))
}

/**
 * Given the set of granted scope ids, returns the MCP tools the token can call: those with at least
 * one fully-granted scope group. Ungated tools — recorded as one empty group (`[[]]`), see
 * ScopeGroupAlternatives — are vacuously satisfied and so reported for every token. A tool with no
 * alternatives at all (`[]`) is reported for nobody.
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
    .filter(([, groups]) => isSatisfied(groups, granted))
    .map(([tool]) => tool)
}

/**
 * Endpoints that are enabled by the complete granted-scope set AND owe that to `capabilityScopes`:
 * some fully-granted group must contain at least one capability scope. Used by the review step to
 * group enabled endpoints under the capability that contributes them (a multi-scope group only
 * appears once all its scopes are granted, and shows under each contributing capability).
 *
 * An endpoint enabled purely through a group that holds none of `capabilityScopes` is not
 * attributed to this capability, and an ungated item is never attributed to any capability.
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
    .filter(([, groups]) =>
      groups.some(
        (group) =>
          group.some((scope) => capability.has(scope)) && group.every((scope) => granted.has(scope))
      )
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

/**
 * The endpoint's payload changed endpoint/tool requirements from a flat conjunctive scope list
 * (string[]) to alternative groups (string[][], ScopeGroupAlternatives) at the same URL, and the
 * response is CDN-cached (s-maxage + stale-while-revalidate). Right after a deploy a new client
 * can still receive a stale flat payload; evaluating it as groups would call group.every on a
 * string and crash the render. Interpret a flat list as what it was — a single conjunctive group.
 */
const isScopeGroup = (value: unknown): value is ScopeGroup =>
  Array.isArray(value) && value.every((scope) => typeof scope === 'string')

const normalizeGroups = (groups: unknown): ScopeGroupAlternatives => {
  // A non-array value is not a shape any server ever emitted — fail closed (nobody) rather
  // than crash the defense itself.
  if (!Array.isArray(groups)) return []
  if (groups.every(isScopeGroup)) return groups
  if (groups.every((scope): scope is string => typeof scope === 'string')) return [groups]
  return []
}

const scopeMapEntrySchema = z.object({
  endpoints: z.array(z.string()),
  mcp_tools: z.array(z.string()),
})

// Group values stay unknown here — normalizeGroups upgrades legacy flat payloads and fails closed
// per entry, which a strict schema would turn into all-or-nothing. `.catch({})` empties a field
// whose record shape is wrong without discarding the salvageable rest of the payload.
const rawPermissionScopeMapSchema = z.object({
  scopes: z.record(scopeMapEntrySchema).catch({}),
  endpoints: z.record(z.unknown()).catch({}),
  mcp_tools: z.record(z.unknown()).catch({}),
})

const EMPTY_PERMISSION_SCOPE_MAP: PermissionScopeMap = { scopes: {}, endpoints: {}, mcp_tools: {} }

export const normalizePermissionScopeMap = (raw: unknown): PermissionScopeMap => {
  const parsed = rawPermissionScopeMapSchema.safeParse(raw)
  // A non-object body (null, an error string) has nothing salvageable — fail closed (empty map)
  // instead of throwing out of the query fn.
  if (!parsed.success) return EMPTY_PERMISSION_SCOPE_MAP

  const { scopes, endpoints, mcp_tools } = parsed.data
  return {
    scopes,
    endpoints: Object.fromEntries(
      Object.entries(endpoints).map(([endpoint, groups]) => [endpoint, normalizeGroups(groups)])
    ),
    mcp_tools: Object.fromEntries(
      Object.entries(mcp_tools).map(([tool, groups]) => [tool, normalizeGroups(groups)])
    ),
  }
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
    console.error('[getScopedAccessTokenPermissions] Failed:', response.status, errorText)

    let retryAfter: number | undefined
    const retryAfterHeader = response.headers.get('Retry-After')
    if (retryAfterHeader !== null) {
      const parsed = Number(retryAfterHeader)
      if (Number.isFinite(parsed) && parsed > 0) retryAfter = parsed
    }

    throw new ResponseError(
      `Failed to fetch scoped access token permissions: ${response.statusText}`,
      response.status,
      undefined,
      retryAfter
    )
  }

  const payload: unknown = await response.json()
  return normalizePermissionScopeMap(payload)
}

export type ScopedAccessTokenPermissionsForScopeError = ResponseError

export const useGetEnabledEndpointsForCapability = () => {
  return useQuery<PermissionScopeMap, ScopedAccessTokenPermissionsForScopeError>({
    queryKey: scopedAccessTokenKeys.permissions(),
    queryFn: ({ signal }) => getGetScopedTokenPermissionsForScope(signal),
  })
}
