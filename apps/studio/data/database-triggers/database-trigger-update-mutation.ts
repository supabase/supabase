import type { PostgresTrigger } from '@supabase/postgres-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import type { ResponseError } from 'types'
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
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseTriggerUpdateData, ResponseError, DatabaseTriggerUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseTriggerUpdateData, ResponseError, DatabaseTriggerUpdateVariables>(
    (vars) => updateDatabaseTrigger(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(databaseTriggerKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update database trigger: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
