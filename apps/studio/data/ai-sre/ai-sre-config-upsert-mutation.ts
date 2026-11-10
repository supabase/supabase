import { joinSqlFragments } from '@supabase/pg-meta/src/pg-format'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { aiSreKeys } from './keys'
import { AI_SRE_SETUP_SQL, buildUpsertConfigSql } from './ai-sre.utils'
import type { AiSreConfig } from './ai-sre.types'
import { unguarded } from '@/data/fetchers'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type AiSreConfigUpsertVariables = {
  projectRef: string
  connectionString?: string | null
  config: AiSreConfig
}

export async function upsertAiSreConfig({
  projectRef,
  connectionString,
  config,
}: AiSreConfigUpsertVariables) {
  // Ensure the schema exists (idempotent) then upsert the singleton config row.
  const sql = joinSqlFragments([AI_SRE_SETUP_SQL, buildUpsertConfigSql(config)], '\n')

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: aiSreKeys.config(projectRef),
    grant: unguarded.byDesign('AI SRE prototype writes to the project-owned supabase_sre schema'),
  })

  return result
}

type AiSreConfigUpsertData = Awaited<ReturnType<typeof upsertAiSreConfig>>

export const useAiSreConfigUpsertMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<AiSreConfigUpsertData, StudioError, AiSreConfigUpsertVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AiSreConfigUpsertData, StudioError, AiSreConfigUpsertVariables>({
    mutationFn: (vars) => upsertAiSreConfig(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: aiSreKeys.config(variables.projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to save AI SRE settings: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}
