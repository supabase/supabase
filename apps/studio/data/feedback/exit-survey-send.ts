import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'

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
  const response = await post(`${API_URL}/feedback/downgrade`, {
    ...(projectRef !== undefined && { projectRef }),
    ...(orgSlug !== undefined && { orgSlug }),
    reasons,
    additionalFeedback: message,
    exitAction,
  })
  if (response.error) throw response.error
  return response
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
