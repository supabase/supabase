import { parseSupportAssistantPrompt } from '@/components/interfaces/Support/SupportAssistant.utils'
import {
  escalateConversationInFront,
  resolveConversationInFront,
  syncConversationMessagesToFront,
} from '@/data/feedback/ai-chat-front-sync'
import type { AiSupportStatus } from '@/data/feedback/ai-chat-front-sync'
import type { AiAssistantState } from '@/state/ai-assistant-state'

/**
 * Extracts plain text content from AI SDK message parts.
 * Messages use a parts array where text content is in `part.type === 'text'`.
 */
function extractTextFromMessage(message: {
  parts?: Array<{ type: string; text?: string }>
}): string {
  if (!message.parts) return ''
  return message.parts
    .filter((part) => part.type === 'text' && part.text)
    .map((part) => part.text ?? '')
    .join('\n')
}

type SyncableChatMessage = {
  id: string
  role: string
  content?: string
  parts?: Array<{ type: string; text?: string }>
}

/**
 * Syncs unsynced support chat messages to Front.
 *
 * Called from the AI assistant state `onFinish` callback (fire-and-forget).
 * Uses `isSyncing` flag to prevent concurrent syncs for the same chat.
 * Uses `lastSyncedMessageCount` to only send new (delta) messages.
 */
export async function syncSupportChatToFront(
  chatId: string,
  state: AiAssistantState
): Promise<void> {
  const chat = state.chats[chatId]
  if (!chat?.supportMetadata) return

  const { supportMetadata } = chat

  // Prevent concurrent syncs
  if (supportMetadata.isSyncing) return
  supportMetadata.isSyncing = true

  try {
    const allMessages = chat.messages
    // Snapshot the boundary now: `chat.messages` may grow while the sync is in
    // flight (streaming finishing, a fast follow-up). Advancing the counter to the
    // post-await length would skip those messages and drop them from Front. On
    // failure we leave the counter untouched and retry the same delta — the server
    // de-dupes by external_id (chatId:msg.id), so retries don't duplicate.
    const syncedUpTo = allMessages.length
    const unsyncedMessages = allMessages.slice(supportMetadata.lastSyncedMessageCount)

    if (unsyncedMessages.length === 0) return

    const isInitial = supportMetadata.lastSyncedMessageCount === 0

    // Convert AI SDK messages to plain text format for the sync API
    const messagesToSync = (unsyncedMessages as SyncableChatMessage[])
      .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
      .map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: extractTextFromMessage(msg) || msg.content || '',
      }))
      // The seeded first message is a full `<support>...</support>` block. On the
      // initial sync we only want the user's actual message (the `<message>` value)
      // in Front, not the metadata block. Once the conversation already exists the
      // metadata was already sent, so drop the block entirely (empty content is
      // filtered out below).
      .map((msg) => {
        const parsed = parseSupportAssistantPrompt(msg.content)
        if (!parsed) return msg
        // When frontConversationId exists the user message was already sent via /feedback/send
        return {
          ...msg,
          content: isInitial && !supportMetadata.frontConversationId ? (parsed.message ?? '') : '',
        }
      })
      .filter((msg) => msg.content.length > 0)

    if (messagesToSync.length === 0) return

    const result = await syncConversationMessagesToFront({
      // Thread on the shared Front thread_ref (from submit) so messages append to the
      // pre-created conversation. Falls back to the studio chat id for chats that
      // weren't created via the support form.
      chatId: supportMetadata.threadRef ?? chatId,
      subject: supportMetadata.subject,
      messages: messagesToSync,
      isInitial,
      conversationId: supportMetadata.frontConversationId,
      ...(isInitial && {
        organizationSlug: supportMetadata.organizationSlug,
        projectRef: supportMetadata.projectRef,
        category: supportMetadata.category,
        severity: supportMetadata.severity,
        affectedServices: supportMetadata.affectedServices,
        library: supportMetadata.library,
        allowSupportAccess: supportMetadata.allowSupportAccess,
        browserInformation: supportMetadata.browserInformation,
      }),
    })

    if (result) {
      // Update sync tracking
      supportMetadata.lastSyncedMessageCount = syncedUpTo

      if (result.conversationId && !supportMetadata.frontConversationId) {
        supportMetadata.frontConversationId = result.conversationId
      }

      // Flush a lifecycle transition that was requested before the Front
      // conversation id existed (e.g. the assistant resolved/escalated the chat
      // before this first message sync returned an id). syncSupportLifecycleToFront
      // uses its own guard, so this won't contend with the message-sync flag.
      if (supportMetadata.frontConversationId && supportMetadata.pendingLifecycleStatus) {
        const pending = supportMetadata.pendingLifecycleStatus
        supportMetadata.pendingLifecycleStatus = undefined
        void syncSupportLifecycleToFront(chatId, state, pending).catch(() => {})
      }
    }
  } finally {
    supportMetadata.isSyncing = false
  }
}

export async function syncSupportLifecycleToFront(
  chatId: string,
  state: AiAssistantState,
  aiSupportStatus: AiSupportStatus
): Promise<void> {
  const chat = state.chats[chatId]
  if (!chat?.supportMetadata) return

  const { supportMetadata } = chat
  if (!supportMetadata.frontConversationId) return
  // Use a dedicated guard so an in-flight message sync (`isSyncing`) can never
  // short-circuit a lifecycle transition. A dropped lifecycle call is never
  // retried, unlike message syncs, so the two must not share a flag.
  if (supportMetadata.isLifecycleSyncing) return

  supportMetadata.isLifecycleSyncing = true

  try {
    let result = null

    const threadRef = supportMetadata.threadRef ?? chatId

    if (aiSupportStatus === 'escalated') {
      result = await escalateConversationInFront({
        chatId: threadRef,
        conversationId: supportMetadata.frontConversationId,
      })
    } else if (aiSupportStatus === 'user_resolved' || aiSupportStatus === 'bot_resolved') {
      result = await resolveConversationInFront({
        chatId: threadRef,
        conversationId: supportMetadata.frontConversationId,
        aiSupportStatus,
      })
    }

    if (result?.aiSupportStatus) {
      supportMetadata.lifecycleStatus = result.aiSupportStatus
    }
  } finally {
    supportMetadata.isLifecycleSyncing = false
  }
}
