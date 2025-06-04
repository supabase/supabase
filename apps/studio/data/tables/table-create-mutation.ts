import pgMeta from '@supabase/pg-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { tableKeys } from './keys'

export type CreateTableBody = components['schemas']['CreateTableBody']

export type TableCreateVariables = {
  projectRef: string
  connectionString?: string | null
  // the schema is required field
  payload: CreateTableBody & { schema: string }
}

export async function createTable({ projectRef, connectionString, payload }: TableCreateVariables) {
  const { sql } = pgMeta.tables.create(payload)

  const { result } = await executeSql<void>({
    projectRef,
    connectionString,
    sql,
    queryKey: ['table', 'create'],
  })

  return result
}

type TableCreateData = Awaited<ReturnType<typeof createTable>>

export const useTableCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<TableCreateData, ResponseError, TableCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableCreateData, ResponseError, TableCreateVariables>(
    (vars) => createTable(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, payload } = variables

        await Promise.all([
          queryClient.invalidateQueries(tableKeys.list(projectRef, payload.schema, true)),
          queryClient.invalidateQueries(tableKeys.list(projectRef, payload.schema, false)),
        ])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create database table: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
