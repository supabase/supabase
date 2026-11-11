import { getPartitionInfoSQL } from '@supabase/pg-meta'
import { queryOptions } from '@tanstack/react-query'

import { entityTypeKeys } from './keys'
import { unguarded } from '@/data/fetchers'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { StudioError } from '@/lib/errors/studio-errors'

export type PartitionInfoVariables = {
  projectRef?: string
  connectionString?: string | null
  id?: number
}

export type PartitionInfo = {
  name: string
  /** Set when the table is itself a partition */
  parent_id: number | null
}

async function getPartitionInfo(
  { projectRef, connectionString, id }: PartitionInfoVariables,
  signal?: AbortSignal
) {
  if (id === undefined) throw new Error('id is required')

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sqlOrigin: 'studio',
      queryName: 'partition-info',
      sql: getPartitionInfoSQL({ id }),
      queryKey: ['partition-info', id],
      grant: unguarded.migrating,
    },
    signal
  )

  return (result[0] ?? null) as PartitionInfo | null
}

export type PartitionInfoData = Awaited<ReturnType<typeof getPartitionInfo>>
export type PartitionInfoError = StudioError

export const partitionInfoQueryOptions = ({
  projectRef,
  connectionString,
  id,
}: PartitionInfoVariables) =>
  queryOptions<PartitionInfoData, PartitionInfoError>({
    queryKey: entityTypeKeys.partitionInfo(projectRef, id),
    queryFn: ({ signal }) => getPartitionInfo({ projectRef, connectionString, id }, signal),
    enabled: typeof projectRef !== 'undefined' && typeof id !== 'undefined',
    staleTime: 5 * 60 * 1000,
  })
