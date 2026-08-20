import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'

import { haClusterPoolersQueryOptions } from '@/data/ha-admin/ha-cluster-poolers-query'

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
