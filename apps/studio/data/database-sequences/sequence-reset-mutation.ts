import { ident, literal, safeSql } from '@supabase/pg-meta/src/pg-format'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { databaseSequencesKeys } from './keys'
import type { DatabaseSequence } from './sequences-query'
import { executeSql } from '@/data/sql/execute-sql-query'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type SequenceResetVariables = {
  projectRef: string
  connectionString?: string | null
  schema: string
  name: string
  newValue: number
}

export async function resetSequence({
  projectRef,
  connectionString,
  schema,
  name,
  newValue,
}: SequenceResetVariables) {
  // ALTER SEQUENCE RESTART WITH makes `newValue` the exact next value returned by nextval()
  const sql = safeSql`ALTER SEQUENCE ${ident(schema)}.${ident(name)} RESTART WITH ${literal(newValue)}`

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['sequences'],
  })

  return result
}

type SequenceResetData = Awaited<ReturnType<typeof resetSequence>>

export const useSequenceResetMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<SequenceResetData, ResponseError, SequenceResetVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<SequenceResetData, ResponseError, SequenceResetVariables>({
    mutationFn: (vars) => resetSequence(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, schema, name, newValue } = variables
      // After RESTART WITH, PostgreSQL sets is_called=false so pg_sequences.last_value
      // returns null. Optimistically update the cache so the UI reflects the reset value.
      queryClient.setQueryData(
        databaseSequencesKeys.list(projectRef, schema),
        (old: DatabaseSequence[] | undefined) => {
          if (!old) return old
          return old.map((seq) =>
            seq.name === name && seq.schema === schema ? { ...seq, last_value: newValue } : seq
          )
        }
      )
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to reset sequence: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
