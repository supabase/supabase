import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databasePublicationsKeys } from './keys'

export type DatabasePublicationUpdateVariables = {
  projectRef: string
  connectionString?: string
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
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const body = { id } as any
  if (tables !== undefined) body.tables = tables
  if (publish_insert !== undefined) body.publish_insert = publish_insert
  if (publish_update !== undefined) body.publish_update = publish_update
  if (publish_delete !== undefined) body.publish_delete = publish_delete
  if (publish_truncate !== undefined) body.publish_truncate = publish_truncate

  const { data, error } = await patch('/platform/pg-meta/{ref}/publications', {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
      query: { id },
    },
    body,
    headers,
  })

  if (error) handleError(error)
  return data
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
