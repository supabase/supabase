import { UIMessage } from '@ai-sdk/react'
import { useMutation } from '@tanstack/react-query'

import type { RateMessageResponse } from 'components/ui/AIAssistantPanel/Message.utils'
import { constructHeaders, fetchHandler } from 'data/fetchers'
import { BASE_PATH } from 'lib/constants'
import { ResponseError, UseCustomMutationOptions } from 'types'

export type RateMessageVariables = {
  rating: 'positive' | 'negative'
  messages: UIMessage[]
  messageId: string
  projectRef: string
  orgSlug?: string
  reason?: string
  spanId?: string
}

export async function rateMessage({
  rating,
  messages,
  messageId,
  projectRef,
  orgSlug,
  reason,
  spanId,
}: RateMessageVariables) {
  const url = `${BASE_PATH}/api/ai/feedback/rate`

  const headers = await constructHeaders({ 'Content-Type': 'application/json' })
  const response = await fetchHandler(url, {
    headers,
    method: 'POST',
    body: JSON.stringify({ rating, messages, messageId, projectRef, orgSlug, reason, spanId }),
  })

  let body: any

  try {
    body = await response.json()
  } catch {}

  if (!response.ok) {
    throw new ResponseError(body?.message, response.status)
  }

  return body as RateMessageResponse
}

type RateMessageData = Awaited<ReturnType<typeof rateMessage>>

export const useRateMessageMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<RateMessageData, ResponseError, RateMessageVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<RateMessageData, ResponseError, RateMessageVariables>({
    mutationFn: (vars) => rateMessage(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        console.error(`Failed to rate message: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
