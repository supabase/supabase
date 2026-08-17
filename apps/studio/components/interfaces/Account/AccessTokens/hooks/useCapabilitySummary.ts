import { useMemo } from 'react'

import {
  getEntryScopes,
  PERMISSION_CATALOG,
  type PermissionCatalogEntry,
  type PermissionMode,
  type PermissionSelection,
} from '../AccessToken.permissions'
import {
  getEnabledEndpointsForCapability,
  getEnabledMcpToolsForCapability,
  type EnabledEndpoint,
  type PermissionScopeMap,
} from '@/data/scoped-access-tokens/permission-scope-map-query'

interface UseCapabilitySummaryArgs {
  selection: PermissionSelection
  grantedScopes: string[]
  permissionScopeMap: PermissionScopeMap | undefined
}

export interface CapabilitySummaryEntry {
  entry: PermissionCatalogEntry
  mode: PermissionMode
  endpoints: EnabledEndpoint[]
  mcpTools: string[]
}

/**
 * Selection-derived summary data for the token view sheet: every granted catalog entry paired with
 * the Management API endpoints and MCP tools it enables.
 */
export const useCapabilitySummary = ({
  selection,
  grantedScopes,
  permissionScopeMap,
}: UseCapabilitySummaryArgs) => {
  const capabilities = useMemo(() => {
    const result: CapabilitySummaryEntry[] = []
    for (const entry of PERMISSION_CATALOG) {
      const mode = selection[entry.key] ?? 'none'
      if (mode === 'none') continue

      const capabilityScopes = getEntryScopes(entry, mode)
      const endpoints = getEnabledEndpointsForCapability({
        capabilityScopes,
        allGrantedScopes: grantedScopes,
        permissionScopeMap,
      })
      const mcpTools = getEnabledMcpToolsForCapability({
        capabilityScopes,
        allGrantedScopes: grantedScopes,
        permissionScopeMap,
      })
      result.push({ entry, mode, endpoints, mcpTools })
    }
    return result
  }, [selection, grantedScopes, permissionScopeMap])

  return { capabilities }
}
