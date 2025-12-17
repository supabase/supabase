import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'

export type ChatSessionMessageDeleteVariables = {
  projectRef: string
  chatId: string
  messageId: string
}

export async function deleteChatSessionMessage(
  { projectRef, chatId, messageId }: ChatSessionMessageDeleteVariables,
  headersInit?: HeadersInit
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!chatId) throw new Error('chatId is required')
  if (!messageId) throw new Error('messageId is required')

  const headers = new Headers(headersInit)

  // Note: This endpoint path will be added to the API types when backend is updated
  const { data, error } = await (del as any)(
    `/v1/projects/{ref}/chat-sessions/{id}/messages/{messageId}`,
    {
      params: { path: { ref: projectRef, id: chatId, messageId } },
      headers,
    }
  )

  if (error) handleError(error)
  return data
}

export type ChatSessionMessageDeleteData = Awaited<ReturnType<typeof deleteChatSessionMessage>>
export type ChatSessionMessageDeleteError = ResponseError
