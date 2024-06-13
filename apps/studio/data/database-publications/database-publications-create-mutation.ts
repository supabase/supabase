import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databasePublicationsKeys } from './keys'

export type DatabasePublicationCreateVariables = {
  projectRef: string
  connectionString?: string
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
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await post('/platform/pg-meta/{ref}/publications', {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
    },
    body: {
      name,
      tables,
      publish_insert,
      publish_update,
      publish_delete,
      publish_truncate,
    },
    headers,
  })

  if (error) handleError(error)
  return data
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
