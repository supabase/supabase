import { useParams } from 'common'

import { isWarehouseProvisioned } from '@/components/interfaces/Integrations/Warehouse/Warehouse.utils'
import { useWarehouseSetupStatusQuery } from '@/data/warehouse/warehouse-setup-status-query'

/**
 * Returns whether Warehouse has finished setting up on this project, which is a different question
 * from whether the feature is available to the org at all — see `useIsWarehouseAvailable` for that.
 *
 * Surfaces that need the individual table states or the setup steps should read
 * `useWarehouseSetupStatusQuery` directly instead.
 */
export const useIsWarehouseProvisioned = ({
  projectRef,
  enabled = true,
}: { projectRef?: string; enabled?: boolean } = {}) => {
  const { ref } = useParams()
  const { data, ...rest } = useWarehouseSetupStatusQuery(
    { projectRef: projectRef ?? ref },
    { enabled }
  )

  return {
    ...rest,
    setupStatus: data?.setup_status,
    isProvisioned: isWarehouseProvisioned(data?.setup_status),
  }
}
