import * as Sentry from '@sentry/nextjs'
import type { components } from 'api-types'

import { post } from '@/data/fetchers'

export type AiSupportStatus = 'bot_active' | 'escalated' | 'user_resolved' | 'bot_resolved'

export type SyncConversationMessagesVariables =
  components['schemas']['SyncConversationMessagesBody']

type SyncConversationMessagesResponse = components['schemas']['SyncConversationMessagesResponse']

type EscalateConversationVariables = components['schemas']['EscalateConversationBody']

type ResolveConversationVariables = components['schemas']['ResolveConversationBody']

type UpdateConversationLifecycleResponse =
  components['schemas']['UpdateConversationLifecycleResponse']

/**
 * Sync AI support chat messages to Front via the Platform API.
 *
 * These are fire-and-forget helpers: failures are reported to Sentry and return
 * `null` so a Front outage never breaks the user's chat. The caller leaves its
 * sync bookkeeping untouched on `null` and retries the same delta on the next
 * turn (the server de-dupes by external_id).
 */
export async function syncConversationMessagesToFront(
  variables: SyncConversationMessagesVariables
): Promise<SyncConversationMessagesResponse | null> {
  const { data, error } = await post('/platform/feedback/conversations/messages', {
    body: variables,
  })

  if (error) {
    Sentry.captureException(error)
    return null
  }

  return data
}

export async function escalateConversationInFront(
  variables: EscalateConversationVariables
): Promise<UpdateConversationLifecycleResponse | null> {
  const { data, error } = await post('/platform/feedback/conversations/escalation', {
    body: variables,
  })

  if (error) {
    Sentry.captureException(error)
    return null
  }

  return data
}

export async function resolveConversationInFront(
  variables: ResolveConversationVariables
): Promise<UpdateConversationLifecycleResponse | null> {
  const { data, error } = await post('/platform/feedback/conversations/resolve', {
    body: variables,
  })

  if (error) {
    Sentry.captureException(error)
    return null
  }

  return data
}
