import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { components } from 'api-types'
import { toast } from 'sonner'

import { logDrainsKeys } from './keys'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

type LogDrainAttributes =
  components['schemas']['CreateLogDrainRequestOpenApi']['data']['attributes']

export type LogDrainCreateVariables = {
  projectRef: string
  name: string
  description: string
  config: LogDrainAttributes['config']
  type: LogDrainAttributes['backend_type']
}

export async function createLogDrain(payload: LogDrainCreateVariables) {
  const { data, error } = await post('/v2/projects/{ref}/analytics/log-drains', {
    params: { path: { ref: payload.projectRef } },
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

type LogDrainCreateData = Awaited<ReturnType<typeof createLogDrain>>

export const useCreateLogDrainMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<LogDrainCreateData, ResponseError, LogDrainCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<LogDrainCreateData, ResponseError, LogDrainCreateVariables>({
    mutationFn: (vars) => createLogDrain(vars),
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
