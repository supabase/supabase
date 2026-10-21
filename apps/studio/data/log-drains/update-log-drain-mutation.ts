import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { components } from 'api-types'
import { toast } from 'sonner'

import { logDrainsKeys } from './keys'
import { handleError, put } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type LogDrainAttributes =
  components['schemas']['UpdateLogDrainRequestOpenApi']['data']['attributes']

export type LogDrainUpdateVariables = {
  projectRef: string
  token?: string
  name: string
  description?: string
  type: LogDrainAttributes['backend_type']
  config: LogDrainAttributes['config']
}

export async function updateLogDrain(payload: LogDrainUpdateVariables) {
  if (!payload.token) {
    throw new Error('Token is required')
  }

  const { data, error } = await put('/v2/projects/{ref}/analytics/log-drains/{id}', {
    params: { path: { ref: payload.projectRef, id: payload.token } },
    body: {
      data: {
        type: 'log_drain',
        attributes: {
          name: payload.name,
          description: payload.description,
          backend_type: payload.type,
          config: payload.config,
        },
      },
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
  UseCustomMutationOptions<LogDrainUpdateData, ResponseError, LogDrainUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<LogDrainUpdateData, ResponseError, LogDrainUpdateVariables>({
    mutationFn: (vars) => updateLogDrain(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      await queryClient.invalidateQueries({ queryKey: logDrainsKeys.list(projectRef) })

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
  })
}
