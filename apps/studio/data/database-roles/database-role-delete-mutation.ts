import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { del } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databaseRolesKeys } from './keys'

export type DatabaseRoleDeleteVariables = {
  projectRef: string
  connectionString?: string
  id: string
}

export async function deleteDatabaseRole({
  projectRef,
  connectionString,
  id,
}: DatabaseRoleDeleteVariables) {
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await del('/platform/pg-meta/{ref}/roles', {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
      query: { id },
    },
    headers,
  })

  if (error) throw error
  return data
}

type DatabaseRoleDeleteData = Awaited<ReturnType<typeof deleteDatabaseRole>>

export const useDatabaseRoleDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseRoleDeleteData, ResponseError, DatabaseRoleDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseRoleDeleteData, ResponseError, DatabaseRoleDeleteVariables>(
    (vars) => deleteDatabaseRole(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseRolesKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete database role: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
