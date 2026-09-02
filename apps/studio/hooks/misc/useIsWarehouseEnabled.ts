import { useQuery } from '@tanstack/react-query'
import { getStringArrayFlag, useParams } from 'common'

import { useIsFeatureEnabled } from './useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from './useSelectedOrganization'
import { IS_PLATFORM } from '@/lib/constants'

/**
 * ConfigCat `StringArrayFlag.Warehouse` key from the platform repo
 * (`packages/api-core/src/constants/flag-definitions.ts`) -- a comma-separated allow-list of org
 * slugs (or the `'none'` sentinel for an empty list), targeted per-project via `targetingKey`.
 */
const WAREHOUSE_CONFIGCAT_FLAG_KEY = 'warehouse'
const WAREHOUSE_ALLOW_ALL_SENTINEL = 'all'

/**
 * Returns whether the Warehouse tab should be shown in the Connect dialog.
 *
 * There is no dedicated "is warehouse enabled" endpoint -- the platform API instead gates every
 * `/platform/warehouse/{ref}/*` call server-side via `verifyWarehouseFeatureEnabledForProject`,
 * which reads the same ConfigCat `warehouse` flag (targeted by project ref) and checks the
 * project's org slug against the returned allow-list. This hook replicates that exact check
 * client-side so tab visibility matches what the API will actually allow, rather than relying on a
 * separate Studio-only flag that could drift from the platform rollout.
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
