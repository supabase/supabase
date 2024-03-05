import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databaseRolesKeys } from './keys'
import type { components } from 'data/api'

type UpdateRoleBody = components['schemas']['UpdateRoleBody']

export type DatabaseRoleUpdateVariables = {
  projectRef: string
  connectionString?: string
  id: number
  payload: UpdateRoleBody
}

export async function updateDatabaseRole({
  projectRef,
  connectionString,
  id,
  payload,
}: DatabaseRoleUpdateVariables) {
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await patch('/platform/pg-meta/{ref}/roles', {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
      query: { id },
    },
    body: payload,
    headers,
  })

  if (error) throw error
  return data
}

type DatabaseRoleUpdateData = Awaited<ReturnType<typeof updateDatabaseRole>>

export const useDatabaseRoleUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseRoleUpdateData, ResponseError, DatabaseRoleUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseRoleUpdateData, ResponseError, DatabaseRoleUpdateVariables>(
    (vars) => updateDatabaseRole(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseRolesKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update database role: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
