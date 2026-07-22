import lodash from 'lodash'
import z from 'zod'

// We don't have an OpenAPI that describes mcp tools security requirements so
// we have this json file that must be updated when they change
import mcp_tools_permissions_map from './mcp_tools_permissions_map.json'
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
  const permissionScopeMapV1 = getEndpointsAndMCPToolsForAPI(apiV1Specs, mcp_tools_permissions_map)

  // Get the permissions map for the API v2
  const apiV2SpecsJSON = await fetchAPIPermissionScope('v2')
  const apiV2Specs = API_SPECS_SCHEMA.parse(apiV2SpecsJSON)
  const permissionScopeMapV2 = getEndpointsAndMCPToolsForAPI(apiV2Specs, mcp_tools_permissions_map)

  const permissionScope = lodash.mergeWith(
    {},
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
//         "security": [
//           {
//             "fga_permissions": [
//               "analytics_config_read"
//             ]
//           }
//         ]
//       }
//     }
//   }
// }
export const getEndpointsAndMCPToolsForAPI = (
  apiSpecs: z.output<typeof API_SPECS_SCHEMA>,
  mcp_tools: McpMap
): PermissionScopeMap => {
  const scopes: ScopeMap = {}
  const endpoints: EndpointMap = {}

  // Loop over each API path to assign endpoints to their scopes and
  // scopes to their endpoints
  Object.entries(apiSpecs.paths).forEach(([path, methods]) => {
    // Loop over each API path method (get, post, etc.)
    Object.entries(methods).forEach(([method, methodSpecs]) => {
      if (methodSpecs.security == null) return

      methodSpecs.security.forEach((security) => {
        if (security.fga_permissions == null) return

        security.fga_permissions.forEach((permission) => {
          const endpoint = `${method.toUpperCase()} ${path}`

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

  return { scopes, endpoints, mcp_tools }
}

const fetchAPIPermissionScope = async (version: 'v1' | 'v2') => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_DOMAIN}/api/${version}-json`, {
    method: 'get',
  })
  if (response.ok) {
    return response.json()
  }
  throw new Error(`Unable to fetch scoped token permission scope: ${response.statusText}`)
}

// Simplified OPEN API specs schemas that only defines what we care about for scoped tokens

const OPEN_API_PATH_METHOD_SCHEMA = z.object({
  security: z
    .array(
      z.object({
        fga_permissions: z.array(z.string()).optional(),
      })
    )
    .optional(),
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
