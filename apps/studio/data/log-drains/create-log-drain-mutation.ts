import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { logDrainsKeys } from './keys'
import { LogDrainSource } from 'components/interfaces/LogDrains/LogDrains.constants'

export type LogDrainCreateVariables = {
  projectRef: string
  name: string
  description?: string
  source: LogDrainSource
  config: Record<string, string>
}

export async function createLogDrain(data: LogDrainCreateVariables) {
  // @ts-ignore Just sample, TS lint will validate if the endpoint is valid
  // const { data, error } = await post('/platform/projects/{ref}/resources/{id}', {
  //   params: { path: { ref: projectRef, id } },
  //   body: { newLogDrain },
  // })

  // if (error) handleError(error)
  // return data

  // store in localstorage for now
  const logDrains = JSON.parse(localStorage.getItem('logDrains') || '[]')
  logDrains.push({
    id: Math.floor(Math.random() * 1000000),
    name: data.name,
    source: data.source,
    config: data.config,
    inserted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  localStorage.setItem('logDrains', JSON.stringify(logDrains))

  return logDrains
}

type LogDrainCreateData = Awaited<ReturnType<typeof createLogDrain>>

export const useCreateLogDrainMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<LogDrainCreateData, ResponseError, LogDrainCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<LogDrainCreateData, ResponseError, LogDrainCreateVariables>(
    (vars) => createLogDrain(vars),
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
