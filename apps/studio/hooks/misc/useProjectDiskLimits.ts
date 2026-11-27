import { useParams } from 'common'
import {
  COMPUTE_DISK,
  getInstanceDiskLimits,
  hasBurstableDiskIO,
  type InstanceDiskLimits,
} from 'shared-data'

import { mapComputeSizeNameToAddonVariantId } from '@/components/interfaces/DiskManagement/DiskManagement.utils'
import { usePrimaryDatabase } from '@/data/read-replicas/replicas-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export type ProjectDiskLimits = {
  /** Exact limits of the project's current instance when known, size-wide floors otherwise */
  limits: InstanceDiskLimits | undefined
  /** True when `limits` are the exact values for the current instance */
  isPerInstance: boolean
  /** Disk IO draws on a burst pool only when the baseline sits below the maximum */
  isBurstable: boolean
  isPending: boolean
}

/**
 * Disk IOPS/throughput limits of the selected project, resolved from the
 * primary database's instance configuration with the project's size-wide
 * floors as fallback (loading states, configurations missing from the table).
 */
export const useProjectDiskLimits = (): ProjectDiskLimits => {
  const { ref: projectRef } = useParams()
  const { data: project, isPending: isPendingProject } = useSelectedProjectQuery()
  const { database: primary, isLoading: isPendingDatabases } = usePrimaryDatabase({ projectRef })

  const instanceLimits = getInstanceDiskLimits(primary?.size)
  const floorLimits = project
    ? COMPUTE_DISK[mapComputeSizeNameToAddonVariantId(project.infra_compute_size)]
    : undefined
  const limits = instanceLimits ?? floorLimits

  return {
    limits,
    isPerInstance: instanceLimits !== undefined,
    isBurstable: hasBurstableDiskIO(limits),
    isPending: isPendingProject || isPendingDatabases,
  }
}
