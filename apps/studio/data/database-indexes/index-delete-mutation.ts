import { ident, safeSql } from '@supabase/pg-meta/src/pg-format'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { databaseIndexesKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-query'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type DatabaseIndexDeleteVariables = {
  projectRef: string
  connectionString?: string | null
  name: string
  schema: string
}

export async function deleteDatabaseIndex({
  projectRef,
  connectionString,
  name,
  schema,
}: DatabaseIndexDeleteVariables) {
  const sql = safeSql`drop index if exists ${ident(schema)}.${ident(name)}`

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['indexes'],
  })

  return result
}

type DatabaseIndexDeleteData = Awaited<ReturnType<typeof deleteDatabaseIndex>>

export const useDatabaseIndexDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<DatabaseIndexDeleteData, ResponseError, DatabaseIndexDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseIndexDeleteData, ResponseError, DatabaseIndexDeleteVariables>({
    mutationFn: (vars) => deleteDatabaseIndex(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: databaseIndexesKeys.list(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete database index: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
