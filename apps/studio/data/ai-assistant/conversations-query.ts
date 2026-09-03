import { queryOptions } from '@tanstack/react-query'

import { assistantFetch } from './fetcher'
import { aiAssistantKeys } from './keys'
import {
  mapConversation,
  unwrapConversationList,
  type AssistantConversationApi,
} from './map-conversation'
import { IS_PLATFORM } from '@/lib/constants'

export type ConversationsVariables = { projectRef?: string }

async function getConversations({ projectRef }: ConversationsVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const payload = await assistantFetch<
    AssistantConversationApi[] | { conversations?: AssistantConversationApi[] }
  >(`/v1/projects/${projectRef}/conversations`, { method: 'GET' }, signal)

  return unwrapConversationList(payload).map(mapConversation)
}

export const conversationsQueryOptions = ({ projectRef }: ConversationsVariables) =>
  queryOptions({
    queryKey: aiAssistantKeys.conversations(projectRef),
    queryFn: ({ signal }) => getConversations({ projectRef }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined',
  })
