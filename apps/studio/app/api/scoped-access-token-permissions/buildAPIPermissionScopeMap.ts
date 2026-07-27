import lodash from 'lodash'
import z from 'zod'

// We don't have an OpenAPI that describes mcp tools security requirements so
// we have this json file that must be updated when they change
import { MCPToolScopeMappings } from './MCPToolScopeMappings'
import {
  EndpointMap,
  McpMap,
  PermissionScopeMap,
  ScopeMap,
} from '@/data/scoped-access-tokens/permission-scope-map-query'

// Default lodash merge does not correctly merge arrays so this custom merger fixes it
function mergeArrays(objValue: unknown, srcValue: unknown) {
  if (Array.isArray(objValue) && Array.isArray(srcValue)) {
    return objValue.concat(srcValue)
  }
}

export const buildAPIPermissionScopeMap = async (): Promise<PermissionScopeMap> => {
  // Get the permissions map for the API v1
  const apiV1SpecsJSON = await fetchAPIPermissionScope('v1')
  const apiV1Specs = API_SPECS_SCHEMA.parse(apiV1SpecsJSON)
  const permissionScopeMapV1 = getEndpointsAndMCPToolsForAPI(apiV1Specs, MCPToolScopeMappings)

  // Get the permissions map for the API v2
  const apiV2SpecsJSON = await fetchAPIPermissionScope('v2')
  const apiV2Specs = API_SPECS_SCHEMA.parse(apiV2SpecsJSON)
  const permissionScopeMapV2 = getEndpointsAndMCPToolsForAPI(apiV2Specs, MCPToolScopeMappings)

  const permissionScope = lodash.mergeWith(
    { mcp_tools: MCPToolScopeMappings },
    permissionScopeMapV1,
    permissionScopeMapV2,
    mergeArrays
  )

  return permissionScope
}

// OPEN API specs look like this (only kept the parts we're interested in):
// {
//   "paths": {
//     "/v2/projects/{ref}/analytics/log-drains": {
//       "get": {
//         "x-fga-permissions": [
//           [
//             "analytics_config_read"
//           ]
//         ]
//       }
//     }
//   }
// }
export const getEndpointsAndMCPToolsForAPI = (
  apiSpecs: z.output<typeof API_SPECS_SCHEMA>,
  mcp_tools: McpMap
): Omit<PermissionScopeMap, 'mcp_tools'> => {
  const scopes: ScopeMap = {}
  const endpoints: EndpointMap = {}

  // Loop over each API path to assign endpoints to their scopes and
  // scopes to their endpoints
  Object.entries(apiSpecs.paths).forEach(([path, methods]) => {
    // Loop over each API path method (get, post, etc.)
    Object.entries(methods).forEach(([method, methodSpecs]) => {
      const endpoint = `${method.toUpperCase()} ${path}`
      if (methodSpecs['x-fga-permissions'] == null) return

      methodSpecs['x-fga-permissions'].forEach((permissions) => {
        permissions?.forEach((permission) => {
          // Initialize scope object if needed
          scopes[permission] = scopes[permission] || { endpoints: [], mcp_tools: [] }

          // Initialize endpoints array if needed
          endpoints[endpoint] = endpoints[endpoint] || []

          if (!scopes[permission].endpoints.includes(endpoint)) {
            scopes[permission].endpoints.push(endpoint)
          }
          if (!endpoints[endpoint].includes(permission)) {
            endpoints[endpoint].push(permission)
          }
        })
      })
    })
  })

  // Assign the mcp tools to their scopes
  Object.entries(mcp_tools).forEach(([mcpTool, toolScopes]) => {
    toolScopes.forEach((toolScope) => {
      if (scopes[toolScope] && !scopes[toolScope].mcp_tools.includes(mcpTool)) {
        scopes[toolScope].mcp_tools.push(mcpTool)
      }
    })
  })

  return { scopes, endpoints }
}

const NEXT_PUBLIC_API_DOMAIN = process.env.NEXT_PUBLIC_API_DOMAIN || 'https://api.supabase.com'

const fetchAPIPermissionScope = async (version: 'v1' | 'v2') => {
  const response = await fetch(`${NEXT_PUBLIC_API_DOMAIN}/api/${version}-json`, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  if (response.ok) {
    return response.json()
  }
  throw new Error(`Unable to fetch scoped token permission scope: ${response.statusText}`)
}

// Simplified OPEN API specs schemas that only defines what we care about for scoped tokens

const OPEN_API_PATH_METHOD_SCHEMA = z.object({
  'x-fga-permissions': z.array(z.string().array().optional()).optional(),
})

const API_SPECS_SCHEMA = z.object({
  paths: z.record(
    z.string(),
    z.record(
      z.enum(['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace']),
      OPEN_API_PATH_METHOD_SCHEMA
    )
  ),
})
