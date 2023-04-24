import { PostgresTrigger } from '@supabase/postgres-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { databaseTriggerKeys } from './keys'

export type DatabaseTriggerDeleteVariables = {
  id: number
  projectRef: string
  connectionString?: string
}

type DeleteDatabaseTriggerResponse = PostgresTrigger & { error?: any }

export async function deleteDatabaseTrigger({
  id,
  projectRef,
  connectionString,
}: DatabaseTriggerDeleteVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const response = (await delete_(`${API_URL}/pg-meta/${projectRef}/triggers?id=${id}`, undefined, {
    headers: Object.fromEntries(headers),
  })) as DeleteDatabaseTriggerResponse

  if (response?.error) throw response.error
  return response as PostgresTrigger
}

type DatabaseTriggerDeleteData = Awaited<ReturnType<typeof deleteDatabaseTrigger>>

export const useDatabaseTriggerDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<DatabaseTriggerDeleteData, unknown, DatabaseTriggerDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseTriggerDeleteData, unknown, DatabaseTriggerDeleteVariables>(
    (vars) => deleteDatabaseTrigger(vars),
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
