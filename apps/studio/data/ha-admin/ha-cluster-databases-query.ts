import { queryOptions } from '@tanstack/react-query'

import { getHaAdmin } from './get-ha-admin'
import { haAdminKeys } from './keys'
import { IS_PLATFORM } from '@/lib/constants'
import type { ResponseError } from '@/types'

export type HaClusterDatabasesVariables = { projectRef?: string }
export type HaClusterDatabasesError = ResponseError

async function getHaClusterDatabases(
  { projectRef }: HaClusterDatabasesVariables,
  signal?: AbortSignal
) {
  return getHaAdmin<{ names?: string[] }>(projectRef, 'databases', signal)
}

export type HaClusterDatabasesData = Awaited<ReturnType<typeof getHaClusterDatabases>>

export const haClusterDatabasesQueryOptions = ({ projectRef }: HaClusterDatabasesVariables) =>
  queryOptions({
    queryKey: haAdminKeys.databases(projectRef),
    queryFn: ({ signal }) => getHaClusterDatabases({ projectRef }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined',
  })
