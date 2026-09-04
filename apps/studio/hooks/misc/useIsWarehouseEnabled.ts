import { useQuery } from '@tanstack/react-query'
import { getStringArrayFlag, useParams } from 'common'

import { useIsFeatureEnabled } from './useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from './useSelectedOrganization'
import { IS_PLATFORM } from '@/lib/constants'

/**
 * ConfigCat flag holding a comma-separated allow-list of org slugs (or the `'none'` sentinel for an
 * empty list), targeted per-project via `targetingKey`.
 */
const WAREHOUSE_CONFIGCAT_FLAG_KEY = 'warehouse'
const WAREHOUSE_ALLOW_ALL_SENTINEL = 'all'

/**
 * Returns whether the Warehouse tab should be shown in the Connect dialog.
 *
 * The API gates every `/platform/warehouse/{ref}/*` call against the same ConfigCat `warehouse`
 * flag, so this mirrors that check client-side and tab visibility matches what the API allows.
 */
export function useIsWarehouseEnabled(): boolean {
  const { ref: projectRef } = useParams()
  const { projectConnectionShowWarehouse: isFeatureFlagEnabled } = useIsFeatureEnabled([
    'project_connection:show_warehouse',
  ])
  const { data: organization } = useSelectedOrganizationQuery({ enabled: IS_PLATFORM })

  const { data: allowedOrgSlugs, isSuccess } = useQuery({
    queryKey: ['warehouse-configcat-flag', projectRef],
    queryFn: () => getStringArrayFlag(WAREHOUSE_CONFIGCAT_FLAG_KEY, projectRef!),
    enabled: IS_PLATFORM && isFeatureFlagEnabled && !!projectRef,
    staleTime: 5 * 60 * 1000,
  })

  if (!IS_PLATFORM || !isFeatureFlagEnabled) return false
  if (!isSuccess || !organization?.slug) return false

  return (
    allowedOrgSlugs.includes(WAREHOUSE_ALLOW_ALL_SENTINEL) ||
    allowedOrgSlugs.includes(organization.slug)
  )
}
