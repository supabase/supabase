import { queryOptions } from '@tanstack/react-query'

import { getHaAdmin } from './get-ha-admin'
import { haAdminKeys } from './keys'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

export type HaClusterPoolersVariables = { projectRef?: string }
export type HaClusterPoolersError = ResponseError

export type Multipooler = {
  id?: { cell?: string; name?: string }
  shardKey?: { database?: string; tableGroup?: string; shard?: string }
  /** @deprecated derived, not authoritative — prefer `routingState.role` */
  type?: 'UNKNOWN' | 'PRIMARY' | 'REPLICA' | 'DRAINED'
  servingStatus?: 'SERVING' | 'DISABLED' | 'DRAINING'
  hostname?: string
  lifecycleStatus?: { status?: string }
  routingState?: {
    role?: string
    // proto int64s, serialized as strings in JSON
    rule?: { coordinatorTerm?: string; leaderSubterm?: string }
  }
}

async function getHaClusterPoolers(
  { projectRef }: HaClusterPoolersVariables,
  signal?: AbortSignal
) {
  return getHaAdmin<{ poolers?: Multipooler[] }>(projectRef, 'poolers', signal)
}

export type HaClusterPoolersData = Awaited<ReturnType<typeof getHaClusterPoolers>>

export const haClusterPoolersQueryOptions = ({ projectRef }: HaClusterPoolersVariables) =>
  queryOptions({
    queryKey: haAdminKeys.poolers(projectRef),
    queryFn: ({ signal }) => getHaClusterPoolers({ projectRef }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined',
  })
