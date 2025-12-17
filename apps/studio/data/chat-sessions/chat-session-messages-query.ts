import { useQuery } from '@tanstack/react-query'
import type { UIMessage } from 'ai'
import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { chatSessionKeys } from './keys'

export type ChatSessionMessagesVariables = {
  id?: string
  projectRef?: string
}

export type ChatMessageResponse = components['schemas']['ChatMessage']

export async function getChatSessionMessages(
  { id, projectRef }: ChatSessionMessagesVariables,
  signal?: AbortSignal,
  headersInit?: HeadersInit
) {
  if (!id) throw new Error('id is required')
  if (!projectRef) throw new Error('projectRef is required')

  const headers = new Headers(headersInit)

  const { data, error } = await get(`/v1/projects/{ref}/chat-sessions/{id}/messages`, {
    params: { path: { ref: projectRef, id } },
    headers,
    signal,
  })

  if (error) handleError(error)

  // API returns { data: ChatMessage[] }
  if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as any).data)) {
    return (data as any).data as UIMessage[]
  }

  // Fallback for direct array response
  if (Array.isArray(data)) {
    return data as UIMessage[]
  }

  throw new Error('Unexpected chat session messages response')
}

export type ChatSessionMessagesData = Awaited<ReturnType<typeof getChatSessionMessages>>
export type ChatSessionMessagesError = ResponseError

export const useChatSessionMessagesQuery = <TData = ChatSessionMessagesData>(
  { id, projectRef }: ChatSessionMessagesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ChatSessionMessagesData, ChatSessionMessagesError, TData> = {}
) =>
  useQuery<ChatSessionMessagesData, ChatSessionMessagesError, TData>({
    queryKey: chatSessionKeys.messages(id ?? ''),
    queryFn: ({ signal }) => getChatSessionMessages({ id, projectRef }, signal),
    enabled: IS_PLATFORM && enabled && typeof id !== 'undefined' && typeof projectRef !== 'undefined',
    ...options,
  })
