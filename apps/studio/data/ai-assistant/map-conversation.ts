import { safeValidateUIMessages, type UIMessage } from 'ai'

import {
  assistantConversationListSchema,
  assistantConversationResponseSchema,
} from '@/data/ai-assistant/contracts'
import type { ChatSession } from '@/state/ai-assistant-state'

export async function parseConversation(payload: unknown): Promise<ChatSession> {
  const {
    conversation: row,
    messages,
    nextCursor,
  } = assistantConversationResponseSchema.parse(payload)
  let parsedMessages: UIMessage[] = []
  if (messages?.length) {
    const validated = await safeValidateUIMessages({ messages })
    if (!validated.success) throw new Error('Invalid conversation messages')
    parsedMessages = validated.data
  }
  return {
    id: row.id,
    name: row.name,
    revision: row.revision,
    messagesLoaded: messages !== undefined,
    messages: parsedMessages,
    nextCursor: nextCursor ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    ...(row.support_metadata
      ? {
          supportMetadata: { ...row.support_metadata, isSyncing: false, isLifecycleSyncing: false },
        }
      : {}),
    ...(row.branched_from
      ? {
          branchedFrom: {
            chatId: row.branched_from.chat_id,
            messageId: row.branched_from.message_id,
          },
        }
      : {}),
  }
}

export async function parseConversationList(payload: unknown): Promise<ChatSession[]> {
  const { conversations } = assistantConversationListSchema.parse(payload)
  return Promise.all(conversations.map((conversation) => parseConversation({ conversation })))
}
