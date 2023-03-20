import { PostgresTrigger } from '@supabase/postgres-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { databaseTriggerKeys } from './keys'

export type DatabaseTriggerCreateVariables = {
  projectRef: string
  connectionString?: string
  payload: any
}

type createDatabaseTriggerResponse = PostgresTrigger & { error?: any }

export async function createDatabaseTrigger({
  projectRef,
  connectionString,
}: DatabaseTriggerCreateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!connectionString) throw new Error('connectionString is required')

  let headers = new Headers()
  headers.set('x-connection-encrypted', connectionString)

  const response = (await post(`${API_URL}/pg-meta/${projectRef}/triggers`, {
    headers: Object.fromEntries(headers),
  })) as createDatabaseTriggerResponse

  if (response?.error) throw response.error
  return response as PostgresTrigger
}

type DatabaseTriggerCreateData = Awaited<ReturnType<typeof createDatabaseTrigger>>

export const useTableRowCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<DatabaseTriggerCreateData, unknown, DatabaseTriggerCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseTriggerCreateData, unknown, DatabaseTriggerCreateVariables>(
    (vars) => createDatabaseTrigger(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseTriggerKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
