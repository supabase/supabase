import { PostgresTrigger } from '@supabase/postgres-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { databaseTriggerKeys } from './keys'

export type DatabaseTriggerCreateVariables = {
  projectRef: string
  connectionString?: string
  payload: any
}

type CreateDatabaseTriggerResponse = PostgresTrigger & { error?: any }

export async function createDatabaseTrigger({
  projectRef,
  connectionString,
  payload,
}: DatabaseTriggerCreateVariables) {
  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const response = (await post(`${API_URL}/pg-meta/${projectRef}/triggers`, payload, {
    headers: Object.fromEntries(headers),
  })) as CreateDatabaseTriggerResponse

  if (response.error) throw response.error
  return response as PostgresTrigger
}

type DatabaseTriggerCreateData = Awaited<ReturnType<typeof createDatabaseTrigger>>

export const useDatabaseTriggerCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseTriggerCreateData, ResponseError, DatabaseTriggerCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseTriggerCreateData, ResponseError, DatabaseTriggerCreateVariables>(
    (vars) => createDatabaseTrigger(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseTriggerKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create database trigger: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
