import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databasePoliciesKeys } from './keys'

type CreatePolicyBody = components['schemas']['CreatePolicyBody']

export type DatabasePolicyCreateVariables = {
  projectRef: string
  connectionString?: string
  payload: CreatePolicyBody
}

export async function createDatabasePolicy({
  projectRef,
  connectionString,
  payload,
}: DatabasePolicyCreateVariables) {
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await post('/platform/pg-meta/{ref}/policies', {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
    },
    body: payload,
    headers,
  })

  if (error) handleError(error)
  return data
}

type DatabasePolicyCreateData = Awaited<ReturnType<typeof createDatabasePolicy>>

export const useDatabasePolicyCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabasePolicyCreateData, ResponseError, DatabasePolicyCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabasePolicyCreateData, ResponseError, DatabasePolicyCreateVariables>(
    (vars) => createDatabasePolicy(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databasePoliciesKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create database policy: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
