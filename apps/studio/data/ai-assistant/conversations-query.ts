import { queryOptions } from '@tanstack/react-query'

import { assistantFetch } from './fetcher'
import { aiAssistantKeys } from './keys'
import { parseConversationList } from './map-conversation'
import { IS_PLATFORM } from '@/lib/constants'

export type ConversationsVariables = { projectRef?: string }

async function getConversations({ projectRef }: ConversationsVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const payload = await assistantFetch<unknown>(
    `/v1/projects/${projectRef}/conversations`,
    { method: 'GET' },
    signal
  )

  return parseConversationList(payload)
}

export const conversationsQueryOptions = ({ projectRef }: ConversationsVariables) =>
  queryOptions({
    queryKey: aiAssistantKeys.conversations(projectRef),
    queryFn: ({ signal }) => getConversations({ projectRef }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined',
  })
