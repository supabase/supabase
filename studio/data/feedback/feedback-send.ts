import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'

export type SendFeedbackVariables = {
  projectRef: string
  message: string
  pathname: string
}

export async function sendFeedback({ projectRef, message, pathname }: SendFeedbackVariables) {
  const response = await post(`${API_URL}/feedback/send`, {
    projectRef,
    message,
    pathname,
    category: 'Feedback',
    tags: ['dashboard-feedback'],
  })
  if (response.error) throw response.error
  return response
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
