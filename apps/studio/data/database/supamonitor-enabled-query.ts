import { useQuery } from '@tanstack/react-query'

import { executeSql } from 'data/sql/execute-sql-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { databaseKeys } from './keys'

export type SupamonitorEnabledVariables = {
  projectRef?: string
  connectionString?: string | null
}

export async function getSupamonitorEnabled({
  projectRef,
  connectionString,
}: SupamonitorEnabledVariables) {
  const { result } = await executeSql<{ libraries: string }[]>({
    projectRef,
    connectionString,
    sql: `SELECT current_setting('shared_preload_libraries', true) AS libraries`,
  })

  const libraries = result[0]?.libraries ?? ''
  return libraries.split(',').some((lib) => lib.trim() === 'supamonitor')
}

export type SupamonitorEnabledData = Awaited<ReturnType<typeof getSupamonitorEnabled>>
export type SupamonitorEnabledError = ResponseError

export const useSupamonitorEnabledQuery = <TData = SupamonitorEnabledData>(
  { projectRef, connectionString }: SupamonitorEnabledVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<SupamonitorEnabledData, SupamonitorEnabledError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<SupamonitorEnabledData, SupamonitorEnabledError, TData>({
    queryKey: databaseKeys.supamonitorEnabled(projectRef),
    queryFn: () => getSupamonitorEnabled({ projectRef, connectionString }),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
