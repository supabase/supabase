import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databaseRolesKeys } from './keys'
import type { components } from 'data/api'

type CreateRoleBody = components['schemas']['CreateRoleBody']

export type DatabaseRoleCreateVariables = {
  projectRef: string
  connectionString?: string
  payload: CreateRoleBody
}

export async function createDatabaseRole({
  projectRef,
  connectionString,
  payload,
}: DatabaseRoleCreateVariables) {
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await post('/platform/pg-meta/{ref}/roles', {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
    },
    body: payload,
    headers,
  })

  if (error) throw error
  return data
}

type DatabaseRoleCreateData = Awaited<ReturnType<typeof createDatabaseRole>>

export const useDatabaseRoleCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseRoleCreateData, ResponseError, DatabaseRoleCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseRoleCreateData, ResponseError, DatabaseRoleCreateVariables>(
    (vars) => createDatabaseRole(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseRolesKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create database role: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
