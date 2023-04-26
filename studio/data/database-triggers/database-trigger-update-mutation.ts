import { PostgresTrigger } from '@supabase/postgres-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { databaseTriggerKeys } from './keys'

export type DatabaseTriggerUpdateVariables = {
  id: number
  projectRef: string
  connectionString?: string
  payload: any
}

type UpdateDatabaseTriggerResponse = PostgresTrigger & { error?: any }

export async function updateDatabaseTrigger({
  id,
  projectRef,
  connectionString,
  payload,
}: DatabaseTriggerUpdateVariables) {
  if (!id) throw new Error('id is required')
  if (!projectRef) throw new Error('projectRef is required')

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const response = (await patch(`${API_URL}/pg-meta/${projectRef}/triggers?id=${id}`, payload, {
    headers: Object.fromEntries(headers),
  })) as UpdateDatabaseTriggerResponse

  if (response.error) throw response.error
  return response as PostgresTrigger
}

type DatabaseTriggerUpdateData = Awaited<ReturnType<typeof updateDatabaseTrigger>>

export const useDatabaseTriggerUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<DatabaseTriggerUpdateData, unknown, DatabaseTriggerUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseTriggerUpdateData, unknown, DatabaseTriggerUpdateVariables>(
    (vars) => updateDatabaseTrigger(vars),
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
