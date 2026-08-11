import { useMemo } from 'react'

import {
  getEntryScopes,
  PERMISSION_CATALOG_BY_CATEGORY,
  type PermissionCatalogEntry,
  type PermissionMode,
  type PermissionSelection,
} from '../AccessToken.permissions'
import {
  getEnabledEndpointsForCapability,
  getEnabledMcpTools,
  PermissionScopeMap,
} from '@/data/scoped-access-tokens/permission-scope-map-query'

interface UseCapabilitySummaryArgs {
  selection: PermissionSelection
  grantedScopes: string[]
  permissionScopeMap: PermissionScopeMap | undefined
}

/**
 * Selection-derived summary data for the token view sheet: selected entries grouped by catalog
 * category, the Management API endpoints each capability enables, and the enabled MCP tools.
 */
export const useCapabilitySummary = ({
  selection,
  grantedScopes,
  permissionScopeMap,
}: UseCapabilitySummaryArgs) => {
  const activeByCategory = useMemo(
    () =>
      PERMISSION_CATALOG_BY_CATEGORY.map((category) => ({
        ...category,
        entries: category.entries
          .map((entry) => ({ entry, mode: selection[entry.key] ?? 'none' }))
          .filter(({ mode }) => mode !== 'none'),
      })).filter((category) => category.entries.length > 0),
    [selection]
  )

  const mcpTools = useMemo(
    () => getEnabledMcpTools({ grantedScopes, permissionScopeMap }),
    [grantedScopes, permissionScopeMap]
  )

  const capabilityGroups = useMemo(() => {
    const groups: { entry: PermissionCatalogEntry; mode: PermissionMode; endpoints: string[][] }[] =
      []
    for (const category of activeByCategory) {
      for (const { entry, mode } of category.entries) {
        const capabilityScopes = getEntryScopes(entry, mode)
        const endpoints = getEnabledEndpointsForCapability({
          capabilityScopes,
          allGrantedScopes: grantedScopes,
          permissionScopeMap,
        })
        if (endpoints.length > 0) {
          groups.push({ entry, mode, endpoints: endpoints.map((e) => [e.method, e.path]) })
        }
      }
    }
    return groups
  }, [activeByCategory, grantedScopes, permissionScopeMap])

  return { activeByCategory, mcpTools, capabilityGroups }
}
