import { queryOptions } from '@tanstack/react-query'

import { assistantFetch } from './fetcher'
import { aiAssistantKeys } from './keys'
import {
  mapConversation,
  unwrapConversation,
  type AssistantConversationApi,
} from './map-conversation'
import { IS_PLATFORM } from '@/lib/constants'

export type ConversationDetailVariables = { id?: string }

async function getConversation({ id }: ConversationDetailVariables, signal?: AbortSignal) {
  if (!id) throw new Error('id is required')

  const payload = await assistantFetch<
    | AssistantConversationApi
    | { conversation?: AssistantConversationApi; messages?: AssistantConversationApi['messages'] }
  >(`/v1/conversations/${id}`, { method: 'GET' }, signal)

  const conversation = unwrapConversation(payload)
  if (!conversation) throw new Error('Conversation not found')
  return mapConversation(conversation)
}

export const conversationDetailQueryOptions = ({ id }: ConversationDetailVariables) =>
  queryOptions({
    queryKey: aiAssistantKeys.conversation(id),
    queryFn: ({ signal }) => getConversation({ id }, signal),
    enabled: IS_PLATFORM && typeof id !== 'undefined',
  })
