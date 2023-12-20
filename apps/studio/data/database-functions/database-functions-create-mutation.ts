import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'data/fetchers'
import { ResponseError } from 'types'
import { databaseFunctionsKeys } from './keys'
import { Dictionary } from 'types'

export type DatabaseFunctionCreateVariables = {
  projectRef: string
  connectionString?: string
  payload: {
    name: string
    schema: string
    args: string[]
    behavior: string // 'VOLATILE' | 'STABLE' | 'IMMUTABLE'
    definition: string
    language: string
    return_type: string
    security_definer: boolean
    config_params?: Dictionary<string>
  }
}

export async function createDatabaseFunction({
  projectRef,
  connectionString,
  payload,
}: DatabaseFunctionCreateVariables) {
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await post('/platform/pg-meta/{ref}/functions', {
    params: {
      path: { ref: projectRef },
    },
    // @ts-ignore API codegen is typed wrongly, i suspect its using the body for edge functions instead
    body: payload,
    headers,
  })

  if (error) throw error
  return data
}

type DatabaseFunctionCreateData = Awaited<ReturnType<typeof createDatabaseFunction>>

export const useDatabaseFunctionCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseFunctionCreateData, ResponseError, DatabaseFunctionCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseFunctionCreateData, ResponseError, DatabaseFunctionCreateVariables>(
    (vars) => createDatabaseFunction(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseFunctionsKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create database function: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
