import { queryOptions } from '@tanstack/react-query'

import { assistantFetch } from './fetcher'
import { aiAssistantKeys } from './keys'
import { parseConversation } from './map-conversation'
import { IS_PLATFORM } from '@/lib/constants'

export type ConversationDetailVariables = { id?: string; before?: number }

export async function getConversation(
  { id, before }: ConversationDetailVariables,
  signal?: AbortSignal
) {
  if (!id) throw new Error('id is required')

  const payload = await assistantFetch<unknown>(
    `/v1/conversations/${id}${before ? `?before=${before}` : ''}`,
    { method: 'GET' },
    signal
  )

  return parseConversation(payload)
}

export const conversationDetailQueryOptions = ({ id }: ConversationDetailVariables) =>
  queryOptions({
    queryKey: aiAssistantKeys.conversation(id),
    queryFn: ({ signal }) => getConversation({ id }, signal),
    enabled: IS_PLATFORM && typeof id !== 'undefined',
  })
