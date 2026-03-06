import pgMeta from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import { privilegeKeys } from 'data/privileges/keys'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { tableKeys } from './keys'

export type CreateTableBody = {
  name: string
  schema?: string
  comment?: string | null
}

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
  UseCustomMutationOptions<TableCreateData, ResponseError, TableCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableCreateData, ResponseError, TableCreateVariables>({
    mutationFn: (vars) => createTable(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, payload } = variables

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: tableKeys.list(projectRef, payload.schema, true),
        }),
        queryClient.invalidateQueries({
          queryKey: tableKeys.list(projectRef, payload.schema, false),
        }),
        queryClient.invalidateQueries({
          queryKey: privilegeKeys.tablePrivilegesList(projectRef),
        }),
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
  })
}
