import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { logDrainsKeys } from './keys'

export type LogDrainDeleteVariables = {
  projectRef: string
  token: string
}

export async function deleteLogDrain({ projectRef, token }: LogDrainDeleteVariables) {
  // @ts-ignore Just sample, TS lint will validate if the endpoint is valid
  const { data, error } = await del('/platform/projects/{ref}/analytics/log-drains/{token}', {
    params: { path: { ref: projectRef, token } },
  })

  if (error) handleError(error)
  return data
}

type LogDrainDeleteData = Awaited<ReturnType<typeof deleteLogDrain>>

export const useDeleteLogDrainMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<LogDrainDeleteData, ResponseError, LogDrainDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<LogDrainDeleteData, ResponseError, LogDrainDeleteVariables>({
    mutationFn: (vars) => deleteLogDrain(vars),
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
