import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'

import { formatCellAsAvailabilityZone, getPoolerStatus } from './HaTopology.utils'
import { AVAILABLE_REPLICA_REGIONS } from './InstanceConfiguration.constants'
import { haClusterPoolersQueryOptions } from '@/data/ha-admin/ha-cluster-poolers-query'
import { usePrimaryDatabase } from '@/data/read-replicas/replicas-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

/**
 * Subscribes to a single pooler's live state from the shared poolers query, so
 * each node/edge updates on its own without re-laying-out the whole diagram.
 */
export const useHaPooler = ({ cell, name }: { cell?: string; name?: string }) => {
  const { ref: projectRef } = useParams()

  return useQuery({
    ...haClusterPoolersQueryOptions({ projectRef }),
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
export const useHaPoolerCard = ({ cell, name }: { cell?: string; name?: string }) => {
  const { ref: projectRef } = useParams()
  const { projectHomepageShowInstanceSize } = useIsFeatureEnabled([
    'project_homepage:show_instance_size',
  ])

  const { database: primary } = usePrimaryDatabase({ projectRef })
  const { data: pooler } = useHaPooler({ cell, name })

  return {
    status: pooler !== undefined ? getPoolerStatus(pooler) : undefined,
    availabilityZone: formatCellAsAvailabilityZone(cell),
    computeSize: projectHomepageShowInstanceSize ? primary?.size : undefined,
    primaryRegion: AVAILABLE_REPLICA_REGIONS.find((r) => primary?.region.includes(r.region)),
  }
}
