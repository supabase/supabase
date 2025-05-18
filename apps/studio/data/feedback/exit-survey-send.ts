import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

export type SendDowngradeFeedbackVariables = {
  projectRef?: string
  orgSlug?: string
  reasons: string
  message: string
  exitAction: 'downgrade' | 'delete'
}

export async function sendDowngradeFeedback({
  projectRef,
  orgSlug,
  reasons,
  message,
  exitAction,
}: SendDowngradeFeedbackVariables) {
  const { data, error } = await post('/platform/feedback/downgrade', {
    body: {
      ...(projectRef !== undefined && { projectRef }),
      ...(orgSlug !== undefined && { orgSlug }),
      reasons,
      additionalFeedback: message,
      exitAction,
    },
  })
  if (error) handleError(error)
  return data
}

type SendDowngradeFeedbackData = Awaited<ReturnType<typeof sendDowngradeFeedback>>

export const useSendDowngradeFeedbackMutation = ({
  onError,
  ...options
}: Omit<
  UseMutationOptions<SendDowngradeFeedbackData, ResponseError, SendDowngradeFeedbackVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<SendDowngradeFeedbackData, ResponseError, SendDowngradeFeedbackVariables>(
    (vars) => sendDowngradeFeedback(vars),
    {
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to submit exit survey: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
