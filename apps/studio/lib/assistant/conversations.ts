import { createConversation } from '@/data/ai-assistant/conversation-create-mutation'
import { conversationsQueryOptions } from '@/data/ai-assistant/conversations-query'
import { assistantFetch } from '@/data/ai-assistant/fetcher'
import { getQueryClient } from '@/data/query-client'
import type { AiAssistantState, ChatSession } from '@/state/ai-assistant-state'

export function persistConversationIfEnabled(
  state: AiAssistantState,
  chat: ChatSession
): Promise<void> {
  if (!state.useAssistantBackend) return Promise.resolve()
  const persistence = state.persistence
  return persistence.enqueue(chat.id, async () => {
    if (chat.revision !== undefined) return
    const { projectRef, orgSlug } = state.context
    if (!projectRef || !orgSlug)
      throw new Error('Select a project and organization before continuing.')
    const created = await createConversation({
      projectRef,
      payload: {
        id: chat.id,
        name: chat.name,
        org_slug: orgSlug,
        model: state.model,
        support_metadata: chat.supportMetadata,
        ...(chat.branchedFrom
          ? {
              branched_from: {
                chat_id: chat.branchedFrom.chatId,
                message_id: chat.branchedFrom.messageId,
              },
            }
          : {}),
      },
    })
    persistence.assertActive()
    chat.revision = created.revision
  })
}

export async function loadConversationsFromBackend(
  projectRef: string
): Promise<Record<string, ChatSession>> {
  const conversations = await getQueryClient().fetchQuery({
    ...conversationsQueryOptions({ projectRef }),
    staleTime: 0,
  })
  return Object.fromEntries(conversations.map((chat) => [chat.id, chat]))
}

export function persistTruncation(
  state: AiAssistantState,
  chat: ChatSession,
  fromMessageId?: string
) {
  if (!state.useAssistantBackend) return
  const persistence = state.persistence
  void persistence.enqueue(chat.id, async () => {
    const result = await assistantFetch<{ revision: number }>(
      `/v1/conversations/${chat.id}/truncate`,
      {
        method: 'POST',
        body: JSON.stringify({ revision: chat.revision, fromMessageId }),
      }
    )
    persistence.assertActive()
    chat.revision = result.revision
  })
}
