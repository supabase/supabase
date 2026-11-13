import { getPartitionCountSQL } from '@supabase/pg-meta'
import { queryOptions } from '@tanstack/react-query'

import { entityTypeKeys } from './keys'
import { unguarded } from '@/data/fetchers'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { StudioError } from '@/lib/errors/studio-errors'

export type PartitionCountVariables = {
  projectRef?: string
  connectionString?: string | null
  id?: number
}

async function getPartitionCount(
  { projectRef, connectionString, id }: PartitionCountVariables,
  signal?: AbortSignal
) {
  if (id === undefined) throw new Error('id is required')

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sqlOrigin: 'studio',
      queryName: 'partition-count',
      sql: getPartitionCountSQL({ id }),
      queryKey: ['partition-count', id],
      grant: unguarded.migrating,
    },
    signal
  )

  return (result[0]?.count ?? 0) as number
}

export type PartitionCountData = Awaited<ReturnType<typeof getPartitionCount>>
export type PartitionCountError = StudioError

/** Counts direct child partitions only, matching what the partition list shows */
export const partitionCountQueryOptions = ({
  projectRef,
  connectionString,
  id,
}: PartitionCountVariables) =>
  queryOptions<PartitionCountData, PartitionCountError>({
    queryKey: entityTypeKeys.partitionCount(projectRef, id),
    queryFn: ({ signal }) => getPartitionCount({ projectRef, connectionString, id }, signal),
    enabled: typeof projectRef !== 'undefined' && typeof id !== 'undefined' && !isNaN(id),
  })
