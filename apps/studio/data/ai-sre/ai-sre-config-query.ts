import { useQuery } from '@tanstack/react-query'

import { aiSreKeys } from './keys'
import { parseConfigRow, SELECT_CONFIG_SQL } from './ai-sre.utils'
import type { AiSreConfig } from './ai-sre.types'
import { unguarded } from '@/data/fetchers'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomQueryOptions } from '@/types'

export type AiSreConfigVariables = {
  projectRef?: string
  connectionString?: string | null
}

export async function getAiSreConfig({ projectRef, connectionString }: AiSreConfigVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: SELECT_CONFIG_SQL,
    queryKey: aiSreKeys.config(projectRef),
    grant: unguarded.byDesign('AI SRE prototype reads from the project-owned supabase_sre schema'),
    // The schema may not exist yet (SRE never enabled) — treat that as "not configured".
    handleError: (error) => {
      if (error.message?.includes('does not exist')) return { result: [] }
      throw error
    },
  })

  return parseConfigRow(result?.[0])
}

export type AiSreConfigData = AiSreConfig | null
export type AiSreConfigError = StudioError

export const useAiSreConfigQuery = <TData = AiSreConfigData>(
  { projectRef, connectionString }: AiSreConfigVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<AiSreConfigData, AiSreConfigError, TData> = {}
) =>
  useQuery<AiSreConfigData, AiSreConfigError, TData>({
    queryKey: aiSreKeys.config(projectRef),
    queryFn: () => getAiSreConfig({ projectRef, connectionString }),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
