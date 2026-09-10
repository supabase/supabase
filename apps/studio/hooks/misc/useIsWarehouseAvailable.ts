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
 * Returns whether Warehouse is available to this org, which is a different question from whether
 * it has been set up on this project — see `useIsWarehouseProvisioned` for that.
 *
 * The API gates every `/platform/warehouse/{ref}/*` call against the same ConfigCat `warehouse`
 * flag, so this mirrors that check client-side and what we surface matches what the API allows.
 */
export function useIsWarehouseAvailable(): boolean {
  const { ref: projectRef } = useParams()
  const { warehouseShow: isFeatureFlagEnabled } = useIsFeatureEnabled(['warehouse:show'])
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
