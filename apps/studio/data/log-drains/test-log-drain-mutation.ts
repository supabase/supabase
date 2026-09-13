import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type LogDrainTestVariables = {
  projectRef: string
  token: string
}

export async function testLogDrain({ projectRef, token }: LogDrainTestVariables) {
  const { data, error } = await post('/platform/projects/{ref}/analytics/log-drains/{token}/test', {
    params: { path: { ref: projectRef, token } },
  })

  if (error) handleError(error)
  return data
}

type LogDrainTestData = Awaited<ReturnType<typeof testLogDrain>>

export const useTestLogDrainMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<LogDrainTestData, ResponseError, LogDrainTestVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<LogDrainTestData, ResponseError, LogDrainTestVariables>({
    mutationFn: (vars) => testLogDrain(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to test log drain: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
