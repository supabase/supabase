import type { PostgresTrigger } from '@supabase/postgres-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { delete_ } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import type { ResponseError } from 'types'
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
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseTriggerDeleteData, ResponseError, DatabaseTriggerDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseTriggerDeleteData, ResponseError, DatabaseTriggerDeleteVariables>(
    (vars) => deleteDatabaseTrigger(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseTriggerKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete database trigger: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
