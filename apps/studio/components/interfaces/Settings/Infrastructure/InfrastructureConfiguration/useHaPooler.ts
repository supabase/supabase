import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'

import { formatCellAsAvailabilityZone, getPoolerStatus, HaPoolerStatus } from './HaTopology.utils'
import { AVAILABLE_REPLICA_REGIONS } from './InstanceConfiguration.constants'
import { haClusterPoolersQueryOptions } from '@/data/ha-admin/ha-cluster-poolers-query'
import { usePrimaryDatabase } from '@/data/read-replicas/replicas-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

/**
 * Subscribes to a single pooler's live state from the shared poolers query, so
 * each node/edge updates on its own without re-laying-out the whole diagram.
 */
export const useHaPooler = ({
  cell,
  name,
  enabled = true,
}: {
  cell?: string
  name?: string
  enabled?: boolean
}) => {
  const { ref: projectRef } = useParams()
  const queryOptions = haClusterPoolersQueryOptions({ projectRef })

  return useQuery({
    ...queryOptions,
    enabled: enabled && queryOptions.enabled,
    select: (data) =>
      (data.poolers ?? []).find((pooler) => pooler.id?.cell === cell && pooler.id?.name === name),
  })
}

/**
 * Everything a pooler node card displays. Region and compute size aren't in
 * multiadmin — they come from the primary database row. HA locks compute to
 * one project-level size, so the primary's size is correct for every node in
 * the cluster.
 */
export const useHaPoolerCard = ({
  cell,
  name,
  statusOverride,
}: {
  cell?: string
  name?: string
  statusOverride?: HaPoolerStatus
}) => {
  const { ref: projectRef } = useParams()
  const { projectHomepageShowInstanceSize } = useIsFeatureEnabled([
    'project_homepage:show_instance_size',
  ])

  const { database: primary } = usePrimaryDatabase({ projectRef })
  const { data: pooler } = useHaPooler({ cell, name, enabled: statusOverride === undefined })

  return {
    status:
      statusOverride !== undefined
        ? statusOverride
        : pooler !== undefined
          ? getPoolerStatus(pooler)
          : undefined,
    availabilityZone: formatCellAsAvailabilityZone(cell),
    computeSize: projectHomepageShowInstanceSize ? primary?.size : undefined,
    primaryRegion: AVAILABLE_REPLICA_REGIONS.find((r) => primary?.region.includes(r.region)),
  }
}
