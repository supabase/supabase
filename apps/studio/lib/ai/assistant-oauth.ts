import { getAssistantApiUrl } from './assistant-backend'

export const ASSISTANT_OAUTH_COMPLETE_TYPE = 'assistant-oauth-complete'

export type AssistantOAuthCompleteMessage = {
  type: typeof ASSISTANT_OAUTH_COMPLETE_TYPE
  org_slug: string
}

export function assistantApiOrigin(apiUrl = getAssistantApiUrl()): string | undefined {
  if (!apiUrl) return undefined
  try {
    return new URL(apiUrl).origin
  } catch {
    return undefined
  }
}

export function readAssistantOAuthCompleteMessage(
  event: { origin: string; data: unknown },
  expectedOrigin: string | undefined
): AssistantOAuthCompleteMessage | null {
  if (!expectedOrigin || event.origin !== expectedOrigin) return null
  const data = event.data
  if (!data || typeof data !== 'object') return null
  if (!('type' in data) || data.type !== ASSISTANT_OAUTH_COMPLETE_TYPE) return null
  if (!('org_slug' in data) || typeof data.org_slug !== 'string' || data.org_slug.length === 0) {
    return null
  }
  return { type: ASSISTANT_OAUTH_COMPLETE_TYPE, org_slug: data.org_slug }
}
