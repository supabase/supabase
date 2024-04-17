import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import pgMeta from '@supabase/pg-meta'
import { toast } from 'react-hot-toast'

import type { ResponseError } from 'types'
import { executeSql } from 'data/sql/execute-sql-query'
import { invalidateSchemasQuery } from './schemas-query'

export type SchemaCreateVariables = {
  name: string
  projectRef?: string
  connectionString?: string
}

export async function createSchema({ name, projectRef, connectionString }: SchemaCreateVariables) {
  const sql = pgMeta.schemas.create({ name, owner: 'postgres' }).sql
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['schema', 'create'],
  })
  return result
}

type SchemaCreateData = Awaited<ReturnType<typeof createSchema>>

export const useSchemaCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SchemaCreateData, ResponseError, SchemaCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<SchemaCreateData, ResponseError, SchemaCreateVariables>(
    (vars) => createSchema(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await invalidateSchemasQuery(queryClient, projectRef)
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create schema: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
