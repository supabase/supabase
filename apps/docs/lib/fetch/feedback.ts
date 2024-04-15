import { type UseMutationOptions, useMutation } from '@tanstack/react-query'

import { type ResponseError } from '~/types/fetch'
import { post } from './fetchWrappers'

type SendFeedbackVariables = {
  title: string
  message: string
  isHelpful: boolean
  pathname?: string
}

export async function sendFeedback({ message, pathname, title, isHelpful }: SendFeedbackVariables) {
  const { data, error } = await post('/platform/feedback/docs', {
    body: {
      page: pathname,
      isHelpful,
      title,
      feedback: message,
    },
  })
  if (error) throw Error(`Couldn't send feedback`, { cause: error })
  return data
}

type SendFeedbackData = Awaited<ReturnType<typeof sendFeedback>>

export const useSendFeedbackMutation = (
  options: Omit<
    UseMutationOptions<SendFeedbackData, ResponseError, SendFeedbackVariables>,
    'mutationFn'
  > = {}
) => {
  return useMutation<SendFeedbackData, ResponseError, SendFeedbackVariables>({
    ...options,
    mutationFn: (vars) => sendFeedback(vars),
    onError: (error, vars, ctx) => {
      console.error(error)
      options.onError?.(error, vars, ctx)
    },
  })
}
