import pgMeta from '@supabase/pg-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databasePublicationsKeys } from './keys'

export type DatabasePublicationUpdateVariables = {
  projectRef: string
  connectionString?: string | null
  id: number
  tables?: string[]
  publish_insert?: boolean
  publish_update?: boolean
  publish_delete?: boolean
  publish_truncate?: boolean
}

export async function updateDatabasePublication({
  projectRef,
  connectionString,
  id,
  tables,
  publish_insert,
  publish_update,
  publish_delete,
  publish_truncate,
}: DatabasePublicationUpdateVariables) {
  const { sql } = pgMeta.publications.update(id, {
    tables,
    publish_insert,
    publish_update,
    publish_delete,
    publish_truncate,
  })

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['publication', 'update', id],
  })

  return result
}

type DatabasePublicationUpdateData = Awaited<ReturnType<typeof updateDatabasePublication>>

export const useDatabasePublicationUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    DatabasePublicationUpdateData,
    ResponseError,
    DatabasePublicationUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    DatabasePublicationUpdateData,
    ResponseError,
    DatabasePublicationUpdateVariables
  >((vars) => updateDatabasePublication(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries(databasePublicationsKeys.list(projectRef))
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update database publication: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
