import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { assistantFetch } from './fetcher'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type MessageFeedbackVariables = {
  conversationId: string
  messageId: string
  rating: 'positive' | 'negative'
  reason?: string
}

async function submitMessageFeedback({
  conversationId,
  messageId,
  rating,
  reason,
}: MessageFeedbackVariables) {
  if (!conversationId) throw new Error('conversationId is required')
  if (!messageId) throw new Error('messageId is required')

  return await assistantFetch<{ ok?: boolean }>(`/v1/messages/${messageId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ conversation_id: conversationId, rating, reason }),
  })
}

type MessageFeedbackData = Awaited<ReturnType<typeof submitMessageFeedback>>

export const useMessageFeedbackMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<MessageFeedbackData, ResponseError, MessageFeedbackVariables>,
  'mutationFn'
> = {}) => {
  return useMutation({
    mutationFn: submitMessageFeedback,
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to submit feedback: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}
