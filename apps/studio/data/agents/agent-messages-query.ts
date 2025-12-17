import { useQuery } from '@tanstack/react-query'
import type { UIMessage } from 'ai'
import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { agentKeys } from './keys'

export type AgentMessagesVariables = {
  id?: string
  projectRef?: string
}

export type AgentMessageResponse = components['schemas']['ChatMessage']

export async function getAgentMessages(
  { id, projectRef }: AgentMessagesVariables,
  signal?: AbortSignal,
  headersInit?: HeadersInit
) {
  if (!id) throw new Error('id is required')
  if (!projectRef) throw new Error('projectRef is required')

  const headers = new Headers(headersInit)

  const { data, error } = await get(`/v1/projects/{ref}/agents/{id}/messages`, {
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

  throw new Error('Unexpected agent messages response')
}

export type AgentMessagesData = Awaited<ReturnType<typeof getAgentMessages>>
export type AgentMessagesError = ResponseError

export const useAgentMessagesQuery = <TData = AgentMessagesData>(
  { id, projectRef }: AgentMessagesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<AgentMessagesData, AgentMessagesError, TData> = {}
) =>
  useQuery<AgentMessagesData, AgentMessagesError, TData>({
    queryKey: agentKeys.messages(id ?? ''),
    queryFn: ({ signal }) => getAgentMessages({ id, projectRef }, signal),
    enabled:
      IS_PLATFORM && enabled && typeof id !== 'undefined' && typeof projectRef !== 'undefined',
    ...options,
  })
