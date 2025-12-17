import type { UIMessage } from 'ai'
import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'

export type ChatSessionMessagesCreateVariables = {
  projectRef: string
  id: string
  messages: UIMessage[]
}

export async function createChatSessionMessages(
  { projectRef, id, messages }: ChatSessionMessagesCreateVariables,
  headersInit?: HeadersInit
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('id is required')

  const headers = new Headers(headersInit)

  const { data, error } = await post(`/v1/projects/{ref}/chat-sessions/{id}/messages`, {
    params: { path: { ref: projectRef, id } },
    body: { messages: messages as any },
    headers,
  })

  if (error) handleError(error)
  return data
}

export type ChatSessionMessagesCreateData = Awaited<ReturnType<typeof createChatSessionMessages>>
export type ChatSessionMessagesCreateError = ResponseError
