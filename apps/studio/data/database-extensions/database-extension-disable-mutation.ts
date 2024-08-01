import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databaseExtensionsKeys } from './keys'

export type DatabaseExtensionDisableVariables = {
  projectRef: string
  connectionString?: string
  id: string
}

export async function disableDatabaseExtension({
  projectRef,
  connectionString,
  id,
}: DatabaseExtensionDisableVariables) {
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await del('/platform/pg-meta/{ref}/extensions', {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
      query: { id },
    },
    headers,
  })

  if (error) handleError(error)
  return data
}

type DatabaseExtensionDisableData = Awaited<ReturnType<typeof disableDatabaseExtension>>

export const useDatabaseExtensionDisableMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    DatabaseExtensionDisableData,
    ResponseError,
    DatabaseExtensionDisableVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    DatabaseExtensionDisableData,
    ResponseError,
    DatabaseExtensionDisableVariables
  >((vars) => disableDatabaseExtension(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries(databaseExtensionsKeys.list(projectRef))
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to disable database extension: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
