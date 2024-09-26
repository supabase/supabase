import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { LogDrainType } from 'components/interfaces/LogDrains/LogDrains.constants'
import { handleError, put } from 'data/fetchers'
import type { ResponseError } from 'types'
import { logDrainsKeys } from './keys'

export type LogDrainUpdateVariables = {
  projectRef: string
  token?: string
  name: string
  description?: string
  type: LogDrainType
  config: Record<string, never>
}

export async function updateLogDrain(payload: LogDrainUpdateVariables) {
  if (!payload.token) {
    throw new Error('Token is required')
  }

  const { data, error } = await put('/platform/projects/{ref}/analytics/log-drains/{token}', {
    params: { path: { ref: payload.projectRef, token: payload.token } },
    body: {
      name: payload.name,
      description: payload.description,
      config: payload.config,
    },
  })

  if (error) handleError(error)
  return data
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
