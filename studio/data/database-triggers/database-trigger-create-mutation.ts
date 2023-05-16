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

type CreateDatabaseTriggerResponse = PostgresTrigger & { error?: any }

export async function createDatabaseTrigger({
  projectRef,
  connectionString,
  payload,
}: DatabaseTriggerCreateVariables) {
  if (!projectRef) throw new Error('projectRef is required')

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
