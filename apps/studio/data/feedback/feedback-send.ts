import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

export type SendFeedbackVariables = {
  message: string
  pathname?: string
  projectRef?: string
  organizationSlug?: string
}

export async function sendFeedback({
  message,
  pathname,
  projectRef,
  organizationSlug,
}: SendFeedbackVariables) {
  const { data, error } = await post(`/platform/feedback/send`, {
    body: {
      message,
      category: 'Feedback',
      tags: ['dashboard-feedback'],
      projectRef,
      organizationSlug,
      pathname,
    },
  })
  if (error) handleError(error)
  return data
}

type SendFeedbackData = Awaited<ReturnType<typeof sendFeedback>>

export const useSendFeedbackMutation = ({
  onError,
  ...options
}: Omit<
  UseMutationOptions<SendFeedbackData, ResponseError, SendFeedbackVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<SendFeedbackData, ResponseError, SendFeedbackVariables>(
    (vars) => sendFeedback(vars),
    {
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to submit feedback: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
