import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { getHaAdmin, parseHaAdminResponse } from './get-ha-admin'
import { haAdminKeys } from './keys'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

export type HaClusterDatabasesVariables = { projectRef?: string }
export type HaClusterDatabasesError = ResponseError

// Every field is optional because proto3 JSON omits zero values.
const haClusterDatabasesResponseSchema = z.object({ names: z.array(z.string()).optional() })

async function getHaClusterDatabases(
  { projectRef }: HaClusterDatabasesVariables,
  signal?: AbortSignal
) {
  const data = await getHaAdmin(projectRef, 'databases', signal)
  return parseHaAdminResponse(haClusterDatabasesResponseSchema, data)
}

export type HaClusterDatabasesData = Awaited<ReturnType<typeof getHaClusterDatabases>>

export const haClusterDatabasesQueryOptions = ({ projectRef }: HaClusterDatabasesVariables) =>
  queryOptions({
    queryKey: haAdminKeys.databases(projectRef),
    queryFn: ({ signal }) => getHaClusterDatabases({ projectRef }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined',
  })
