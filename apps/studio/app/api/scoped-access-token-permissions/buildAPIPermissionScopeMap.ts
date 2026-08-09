import { cloneDeep } from 'lodash'
import z from 'zod'

// We don't have an OpenAPI that describes mcp tools security requirements so
// we have this hard coded file that must be updated when they change
import { MCPToolScopeMappings } from './MCPToolScopeMappings'
import {
  EndpointMap,
  McpMap,
  PermissionScopeMap,
  ScopeMap,
} from '@/data/scoped-access-tokens/permission-scope-map-query'
import { InternalServerError } from '@/lib/api/apiHelpers'

/*
 * Builds the permissions/endpoint mapping by fetching the OpenAPI specs for our v1 and v2 APIs.
 * The two specs are indexed together rather than merged afterwards: every v1 path starts with
 * `/v1/` and every v2 path with `/v2/`, so they can't collide, and one pass de-duplicates a
 * scope's endpoint list by construction.
 * @throws InternalServerError when it can't fetch the OpenAPI specs
 */
export const buildAPIPermissionScopeMap = async (): Promise<PermissionScopeMap> => {
  const [apiV1SpecsJSON, apiV2SpecsJSON] = await Promise.all([
    fetchAPIPermissionScope('v1'),
    fetchAPIPermissionScope('v2'),
  ])
  const apiV1Specs = API_SPECS_SCHEMA.parse(apiV1SpecsJSON)
  const apiV2Specs = API_SPECS_SCHEMA.parse(apiV2SpecsJSON)

  const { scopes, endpoints } = getScopesAndEndpointsForAPI({
    paths: { ...apiV1Specs.paths, ...apiV2Specs.paths },
  })
  addMCPToolsToScopes(scopes, MCPToolScopeMappings)

  return {
    scopes,
    endpoints,
    // Deep copy so a caller mutating the response can't corrupt the module-level mapping, which
    // outlives every request in a long-running server.
    mcp_tools: cloneDeep(MCPToolScopeMappings),
  }
}

// OPEN API specs look like this (only kept the parts we're interested in):
// {
//   "paths": {
//     "/v1/projects/{ref}/branches": {
//       "get": {
//         "x-fga-permissions": [
//           ["branching_development_read"],
//           ["branching_production_read"]
//         ]
//       }
//     }
//   }
// }
// The extension value is a list of alternative permission groups: a token needs ALL permissions
// of at least ONE group (OR between groups, AND within a group). Groups must be preserved verbatim,
// not flattened, or OR-alternatives (e.g. development vs production branching) turn into impossible
// conjunctions. An endpoint with no usable group is dropped entirely rather than recorded with an
// empty requirement, which would read as "ungated" and mark it callable by every token.
//
// KNOWN DIVERGENCE: annotations are trusted verbatim, and the one on
// POST /v1/projects/{ref}/database/query overstates access — the spec publishes
// `[[database_read], [database_write]]`, but the route's guard requires database_read outright and
// the write group is doc-only (see the execute_sql entry in MCPToolScopeMappings.ts). A token
// granted only database_write is therefore shown this endpoint as callable when the guard would
// reject it. Studio-created tokens can't hit this (write mode always grants the read scopes too),
// so this stays a display inaccuracy for API-created tokens; the fix is correcting the annotation
// upstream in the mgmt-api, not special-casing it here.
export const getScopesAndEndpointsForAPI = (
  apiSpecs: z.output<typeof API_SPECS_SCHEMA>
): Omit<PermissionScopeMap, 'mcp_tools'> => {
  const scopes: ScopeMap = {}
  const endpoints: EndpointMap = {}

  // Loop over each API path to record endpoint permission groups and index scopes -> endpoints
  Object.entries(apiSpecs.paths).forEach(([path, methods]) => {
    // Loop over each API path method (get, post, etc.)
    Object.entries(methods).forEach(([method, methodSpecs]) => {
      const endpoint = `${method.toUpperCase()} ${path}`
      const groups = (methodSpecs['x-fga-permissions'] ?? []).filter(
        (group): group is string[] => Array.isArray(group) && group.length > 0
      )
      if (groups.length === 0) return

      endpoints[endpoint] = groups

      groups.flat().forEach((permission) => {
        // Initialize scope object if needed
        scopes[permission] = scopes[permission] || { endpoints: [], mcp_tools: [] }

        if (!scopes[permission].endpoints.includes(endpoint)) {
          scopes[permission].endpoints.push(endpoint)
        }
      })
    })
  })

  return { scopes, endpoints }
}

// Assign the mcp tools to their scopes. Scopes referenced only by tools (no endpoint lists them,
// e.g. project_snippets_read) are initialized here so they don't vanish from the map. Ungated tools
// reference no scope, so they're absent from this index by construction — they belong to no
// capability and `getEnabledMcpTools` reports them for every token instead.
export const addMCPToolsToScopes = (scopes: ScopeMap, mcp_tools: McpMap) => {
  Object.entries(mcp_tools).forEach(([mcpTool, toolScopeGroups]) => {
    toolScopeGroups.flat().forEach((toolScope) => {
      scopes[toolScope] = scopes[toolScope] || { endpoints: [], mcp_tools: [] }
      if (!scopes[toolScope].mcp_tools.includes(mcpTool)) {
        scopes[toolScope].mcp_tools.push(mcpTool)
      }
    })
  })
}

const NEXT_PUBLIC_API_DOMAIN = process.env.NEXT_PUBLIC_API_DOMAIN || 'https://api.supabase.com'

const fetchAPIPermissionScope = async (version: 'v1' | 'v2') => {
  try {
    const response = await fetch(`${NEXT_PUBLIC_API_DOMAIN}/api/${version}-json`, {
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (response.ok) {
      return response.json()
    }
    const responseText = await response.text()

    const retryAfter = response.headers.get('Retry-After') ?? undefined
    throw new InternalServerError(`API v${version} responded with ${response.status}`, {
      status: response.status,
      body: responseText,
      ...(retryAfter !== undefined && { retryAfter }),
    })
  } catch (error: unknown) {
    if (error instanceof InternalServerError) {
      throw error
    }

    if (error instanceof Error) {
      throw new InternalServerError(error.message)
    }
  }
}

// Simplified OPEN API specs schemas that only defines what we care about for scoped tokens

const OPEN_API_PATH_METHOD_SCHEMA = z.object({
  'x-fga-permissions': z.array(z.string().array().optional()).optional(),
})

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'] as const

// OpenAPI path items may legally carry non-operation members (path-level `parameters`, `summary`,
// `description`, `servers`, `$ref`). z.record with an enum key schema rejects unknown keys
// outright, which would turn a benign upstream spec change into a 500 for this whole route —
// strip them before validating the operations.
const OPEN_API_PATH_ITEM_SCHEMA = z.preprocess(
  (item) =>
    item !== null && typeof item === 'object'
      ? Object.fromEntries(
          Object.entries(item).filter(([key]) => (HTTP_METHODS as readonly string[]).includes(key))
        )
      : item,
  z.record(z.enum(HTTP_METHODS), OPEN_API_PATH_METHOD_SCHEMA)
)

const API_SPECS_SCHEMA = z.object({
  paths: z.record(z.string(), OPEN_API_PATH_ITEM_SCHEMA),
})
