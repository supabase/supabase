import * as Sentry from '@sentry/nextjs'
import { fetchPost } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'

export type AiSupportStatus = 'bot_active' | 'escalated' | 'user_resolved' | 'bot_resolved'

export type SyncConversationMessagesVariables = {
  chatId: string
  subject: string
  messages: Array<{ id: string; role: 'user' | 'assistant'; content: string }>
  isInitial?: boolean
  conversationId?: string
  organizationSlug?: string
  projectRef?: string
  category?: string
  severity?: string
  affectedServices?: string
  library?: string
  allowSupportAccess?: boolean
  browserInformation?: string
}

type SyncConversationMessagesResponse = {
  result: 'success'
  conversationId?: string
}

type UpdateConversationLifecycleVariables = {
  chatId: string
  conversationId: string
}

type ResolveConversationVariables = UpdateConversationLifecycleVariables & {
  aiSupportStatus: Extract<AiSupportStatus, 'user_resolved' | 'bot_resolved'>
}

type UpdateConversationLifecycleResponse = {
  result: 'success'
  conversationId: string
  aiSupportStatus: AiSupportStatus
}

function hasErrorResponse(value: unknown): value is { error: unknown } {
  return typeof value === 'object' && value !== null && 'error' in value
}

/**
 * Sync AI support chat messages to Front via the Platform API.
 * This is a fire-and-forget function - errors are logged to Sentry but never thrown.
 */
export async function syncConversationMessagesToFront(
  variables: SyncConversationMessagesVariables
): Promise<SyncConversationMessagesResponse | null> {
  try {
    const url = `${API_URL}/feedback/conversations/messages`
    const res = await fetchPost<SyncConversationMessagesResponse>(url, variables)

    if (res instanceof Error || !res || hasErrorResponse(res)) {
      const error = res instanceof Error ? res : new Error(`Sync failed: ${JSON.stringify(res)}`)
      console.error('syncConversationMessagesToFront - Error:', error)
      Sentry.captureException(error)
      return null
    }

    return res
  } catch (error) {
    console.error('syncConversationMessagesToFront - Error:', error)
    Sentry.captureException(error)
    return null
  }
}

export async function escalateConversationInFront(
  variables: UpdateConversationLifecycleVariables
): Promise<UpdateConversationLifecycleResponse | null> {
  try {
    const url = `${API_URL}/feedback/conversations/escalation`
    const res = await fetchPost<UpdateConversationLifecycleResponse>(url, variables)

    if (res instanceof Error || !res || hasErrorResponse(res)) {
      const error =
        res instanceof Error ? res : new Error(`Escalation failed: ${JSON.stringify(res)}`)
      console.error('escalateConversationInFront - Error:', error)
      Sentry.captureException(error)
      return null
    }

    return res
  } catch (error) {
    console.error('escalateConversationInFront - Error:', error)
    Sentry.captureException(error)
    return null
  }
}

export async function resolveConversationInFront(
  variables: ResolveConversationVariables
): Promise<UpdateConversationLifecycleResponse | null> {
  try {
    const url = `${API_URL}/feedback/conversations/resolve`
    const res = await fetchPost<UpdateConversationLifecycleResponse>(url, variables)

    if (res instanceof Error || !res || hasErrorResponse(res)) {
      const error =
        res instanceof Error ? res : new Error(`Resolution failed: ${JSON.stringify(res)}`)
      console.error('resolveConversationInFront - Error:', error)
      Sentry.captureException(error)
      return null
    }

    return res
  } catch (error) {
    console.error('resolveConversationInFront - Error:', error)
    Sentry.captureException(error)
    return null
  }
}
