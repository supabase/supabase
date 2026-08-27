import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { getHaAdmin, parseHaAdminResponse } from './get-ha-admin'
import { haAdminKeys } from './keys'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

export type HaClusterPoolersVariables = { projectRef?: string }
export type HaClusterPoolersError = ResponseError

// Hand-modelled subset of multiadmin's OpenAPI spec. Every field is optional
// because proto3 JSON omits zero values, and enum-shaped fields stay plain
// strings (expected values in comments) so new proto values degrade gracefully
// instead of failing the whole parse.
const multipoolerSchema = z.object({
  id: z.object({ cell: z.string().optional(), name: z.string().optional() }).optional(),
  shardKey: z
    .object({
      database: z.string().optional(),
      tableGroup: z.string().optional(),
      shard: z.string().optional(),
    })
    .optional(),
  // 'UNKNOWN' | 'PRIMARY' | 'REPLICA' | 'DRAINED' — deprecated (derived, not
  // authoritative), prefer `routingState.role`
  type: z.string().optional(),
  // 'SERVING' | 'DISABLED' | 'DRAINING'
  servingStatus: z.string().optional(),
  hostname: z.string().optional(),
  // `PoolerLifecycleStatus` (multigres proto/clustermetadata.proto):
  // 'STARTING' | 'ACTIVE' | 'STOPPING' | 'SHUTDOWN' | 'QUARANTINED', optionally
  // prefixed with 'LIFECYCLE_'. 'LIFECYCLE_UNKNOWN' is the zero value, so it is
  // omitted from JSON. There is no dedicated failure member — QUARANTINED is the
  // terminal failure state (the pooler gave up recovering, e.g. a failed
  // pg_rewind or backup restore, and is kept alive for forensics) and SHUTDOWN is
  // "durably down". `getPoolerStatus` maps every member; an unrecognized value
  // falls through to the `servingStatus` check.
  lifecycleStatus: z.object({ status: z.string().optional() }).optional(),
  routingState: z
    .object({
      role: z.string().optional(),
      // proto int64s, serialized as strings in JSON
      rule: z
        .object({ coordinatorTerm: z.string().optional(), leaderSubterm: z.string().optional() })
        .optional(),
    })
    .optional(),
})

const haClusterPoolersResponseSchema = z.object({
  poolers: z.array(multipoolerSchema).optional(),
})

export type Multipooler = z.infer<typeof multipoolerSchema>

async function getHaClusterPoolers(
  { projectRef }: HaClusterPoolersVariables,
  signal?: AbortSignal
) {
  const data = await getHaAdmin(projectRef, 'poolers', signal)
  return parseHaAdminResponse(haClusterPoolersResponseSchema, data)
}

export type HaClusterPoolersData = Awaited<ReturnType<typeof getHaClusterPoolers>>

export const haClusterPoolersQueryOptions = ({ projectRef }: HaClusterPoolersVariables) =>
  queryOptions({
    queryKey: haAdminKeys.poolers(projectRef),
    queryFn: ({ signal }) => getHaClusterPoolers({ projectRef }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined',
  })
