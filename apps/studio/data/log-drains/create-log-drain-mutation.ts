import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { LogDrainType } from 'components/interfaces/LogDrains/LogDrains.constants'
import { handleError, post } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { logDrainsKeys } from './keys'

export type LogDrainCreateVariables = {
  projectRef: string
  name: string
  description: string
  config: Record<string, never>
  type: LogDrainType
}

export async function createLogDrain(payload: LogDrainCreateVariables) {
  const { data, error } = await post('/platform/projects/{ref}/analytics/log-drains', {
    params: { path: { ref: payload.projectRef } },
    body: {
      name: payload.name,
      description: payload.description,
      type: payload.type,
      config: payload.config as any,
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
