import { useQuery } from '@tanstack/react-query'

import { aiSreKeys } from './keys'
import { parseRunRow, SELECT_RUNS_SQL } from './ai-sre.utils'
import type { AiSreRun } from './ai-sre.types'
import { unguarded } from '@/data/fetchers'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomQueryOptions } from '@/types'

export type AiSreRunsVariables = {
  projectRef?: string
  connectionString?: string | null
}

export async function getAiSreRuns({ projectRef, connectionString }: AiSreRunsVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: SELECT_RUNS_SQL,
    queryKey: aiSreKeys.runs(projectRef),
    grant: unguarded.byDesign('AI SRE prototype reads from the project-owned supabase_sre schema'),
    handleError: (error) => {
      if (error.message?.includes('does not exist')) return { result: [] }
      throw error
    },
  })

  return (result ?? []).map(parseRunRow)
}

export type AiSreRunsData = AiSreRun[]
export type AiSreRunsError = StudioError

export const useAiSreRunsQuery = <TData = AiSreRunsData>(
  { projectRef, connectionString }: AiSreRunsVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<AiSreRunsData, AiSreRunsError, TData> = {}
) =>
  useQuery<AiSreRunsData, AiSreRunsError, TData>({
    queryKey: aiSreKeys.runs(projectRef),
    queryFn: () => getAiSreRuns({ projectRef, connectionString }),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
