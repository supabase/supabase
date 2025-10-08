import pgMeta from '@supabase/pg-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databasePublicationsKeys } from './keys'

export type DatabasePublicationCreateVariables = {
  projectRef: string
  connectionString?: string | null
  name: string
  tables?: string[]
  publish_insert?: boolean
  publish_update?: boolean
  publish_delete?: boolean
  publish_truncate?: boolean
}

export async function createDatabasePublication({
  projectRef,
  connectionString,
  name,
  tables = [],
  publish_insert = false,
  publish_update = false,
  publish_delete = false,
  publish_truncate = false,
}: DatabasePublicationCreateVariables) {
  const { sql } = pgMeta.publications.create({
    name,
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
    queryKey: ['publication', 'create'],
  })

  return result
}

type DatabasePublicationCreateData = Awaited<ReturnType<typeof createDatabasePublication>>

export const useDatabasePublicationCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    DatabasePublicationCreateData,
    ResponseError,
    DatabasePublicationCreateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    DatabasePublicationCreateData,
    ResponseError,
    DatabasePublicationCreateVariables
  >((vars) => createDatabasePublication(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries(databasePublicationsKeys.list(projectRef))
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create database publication: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
