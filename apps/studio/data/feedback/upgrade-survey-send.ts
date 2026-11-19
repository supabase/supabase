import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

export type SendUpgradeFeedbackVariables = {
  orgSlug?: string
  prevPlan?: string
  currentPlan?: string
  reasons: string[]
  message?: string
}

export async function sendUpgradeFeedback({
  orgSlug,
  prevPlan,
  currentPlan,
  reasons,
  message,
}: SendUpgradeFeedbackVariables) {
  const { data, error } = await post('/platform/feedback/upgrade', {
    body: {
      ...(orgSlug !== undefined && { orgSlug }),
      ...(prevPlan !== undefined && { prevPlan }),
      ...(currentPlan !== undefined && { currentPlan }),
      reasons,
      ...(message !== undefined && { additionalFeedback: message }),
    },
  })
  if (error) handleError(error)
  return data
}

type SendUpgradeFeedbackData = Awaited<ReturnType<typeof sendUpgradeFeedback>>

export const useSendUpgradeFeedbackMutation = ({
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<SendUpgradeFeedbackData, StudioError, SendUpgradeFeedbackVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<SendUpgradeFeedbackData, StudioError, SendUpgradeFeedbackVariables>({
    mutationFn: (vars) => sendUpgradeFeedback(vars),
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to submit upgrade survey: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
