import type { UIMessage } from '@ai-sdk/react'

import type { ChatSession, SupportChatMetadata } from '@/state/ai-assistant-state'

export type AssistantConversationApi = {
  id: string
  name: string
  project_ref?: string
  created_at: string
  updated_at: string
  support_metadata?: SupportChatMetadata | null
  branched_from?: {
    chat_id?: string
    chatId?: string
    message_id?: string
    messageId?: string
  } | null
  messages?: UIMessage[]
}

export function mapConversation(row: AssistantConversationApi): ChatSession {
  const branched = row.branched_from
  const chatId = branched?.chatId ?? branched?.chat_id
  const messageId = branched?.messageId ?? branched?.message_id

  return {
    id: row.id,
    name: row.name,
    messages: row.messages ?? [],
    createdAt: new Date(row.created_at ?? Date.now()),
    updatedAt: new Date(row.updated_at ?? Date.now()),
    ...(row.support_metadata ? { supportMetadata: row.support_metadata } : {}),
    ...(chatId && messageId ? { branchedFrom: { chatId, messageId } } : {}),
  }
}

export function unwrapConversation(
  payload:
    | AssistantConversationApi
    | { conversation?: AssistantConversationApi; messages?: AssistantConversationApi['messages'] }
    | undefined
): AssistantConversationApi | undefined {
  if (!payload) return undefined
  if ('conversation' in payload && payload.conversation) {
    return {
      ...payload.conversation,
      messages: payload.messages ?? payload.conversation.messages,
    }
  }
  if ('id' in payload && typeof payload.id === 'string') return payload
  return undefined
}

export function unwrapConversationList(
  payload: AssistantConversationApi[] | { conversations?: AssistantConversationApi[] } | undefined
): AssistantConversationApi[] {
  if (Array.isArray(payload)) return payload
  if (payload?.conversations && Array.isArray(payload.conversations)) return payload.conversations
  return []
}
