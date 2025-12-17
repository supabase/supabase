import { useQuery } from '@tanstack/react-query'
import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { chatSessionKeys } from './keys'

export type ChatSessionsVariables = {
  projectRef?: string
}

export type ChatSessionResponse = components['schemas']['ChatSession']

export async function getChatSessions({ projectRef }: ChatSessionsVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/v1/projects/{ref}/chat-sessions`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)

  if (Array.isArray(data)) return data as ChatSessionResponse[]

  if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as any).data)) {
    return (data as any).data as ChatSessionResponse[]
  }

  throw new Error('Unexpected chat sessions response')
}

export type ChatSessionsData = Awaited<ReturnType<typeof getChatSessions>>
export type ChatSessionsError = ResponseError

export const useChatSessionsQuery = <TData = ChatSessionsData>(
  { projectRef }: ChatSessionsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ChatSessionsData, ChatSessionsError, TData> = {}
) =>
  useQuery<ChatSessionsData, ChatSessionsError, TData>({
    queryKey: chatSessionKeys.list(projectRef),
    queryFn: ({ signal }) => getChatSessions({ projectRef }, signal),
    enabled: IS_PLATFORM && enabled && typeof projectRef !== 'undefined',
    ...options,
  })
