import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { logDrainsKeys } from './keys'
import { LogDrainSource } from 'components/interfaces/LogDrains/LogDrains.constants'

export type LogDrainUpdateVariables = {
  projectRef: string
  id: number
  name: string
  description?: string
  source: LogDrainSource
}

export async function updateLogDrain(data: LogDrainUpdateVariables) {
  // @ts-ignore Just sample, TS lint will validate if the endpoint is valid
  // const { data, error } = await post('/platform/projects/{ref}/resources/{id}', {
  //   params: { path: { ref: projectRef, id } },
  //   body: { updatedLogDrain },
  // })

  // if (error) handleError(error)
  // return data

  // update in localstorage for now
  const logDrains = JSON.parse(localStorage.getItem('logDrains') || '[]')
  const index = logDrains.findIndex((drain: any) => drain.id === data.id)
  if (index !== -1) {
    logDrains[index] = {
      ...logDrains[index],
      name: data.name,
      source: data.source,
      updated_at: new Date().toISOString(),
    }
    localStorage.setItem('logDrains', JSON.stringify(logDrains))
  }

  return logDrains
}

type LogDrainUpdateData = Awaited<ReturnType<typeof updateLogDrain>>

export const useUpdateLogDrainMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<LogDrainUpdateData, ResponseError, LogDrainUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<LogDrainUpdateData, ResponseError, LogDrainUpdateVariables>(
    (vars) => updateLogDrain(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables

        await queryClient.invalidateQueries(logDrainsKeys.list(projectRef))

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to mutate: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
