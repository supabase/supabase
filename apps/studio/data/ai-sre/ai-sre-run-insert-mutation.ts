import { joinSqlFragments } from '@supabase/pg-meta/src/pg-format'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { AI_SRE_SETUP_SQL, buildInsertRunSql, type InsertRunInput } from './ai-sre.utils'
import { aiSreKeys } from './keys'
import { unguarded } from '@/data/fetchers'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type AiSreRunInsertVariables = {
  projectRef: string
  connectionString?: string | null
  run: InsertRunInput
}

export async function insertAiSreRun({
  projectRef,
  connectionString,
  run,
}: AiSreRunInsertVariables) {
  // Run the idempotent schema setup first so the transcript column exists even
  // for projects that enabled the SRE before it was added.
  const sql = joinSqlFragments([AI_SRE_SETUP_SQL, buildInsertRunSql(run)], '\n')

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: aiSreKeys.runs(projectRef),
    grant: unguarded.byDesign('AI SRE prototype writes run history to the supabase_sre schema'),
  })

  return result?.[0] as { id: string } | undefined
}

type AiSreRunInsertData = Awaited<ReturnType<typeof insertAiSreRun>>

export const useAiSreRunInsertMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<AiSreRunInsertData, StudioError, AiSreRunInsertVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AiSreRunInsertData, StudioError, AiSreRunInsertVariables>({
    mutationFn: (vars) => insertAiSreRun(vars),
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries({ queryKey: aiSreKeys.runs(variables.projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to save AI SRE run: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}
