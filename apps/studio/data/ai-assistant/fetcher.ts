import { getAssistantApiUrl } from '@/lib/assistant/backend'
import { getAssistantRequestHeaders } from '@/lib/assistant/client'
import { ResponseError } from '@/types'

export class AssistantApiError extends ResponseError {
  constructor(
    message: string,
    status: number,
    readonly assistantCode?: string,
    readonly orgSlug?: string
  ) {
    super(message, status)
  }
}

export function isAssistantOAuthRequiredError(error: unknown): error is AssistantApiError {
  return (
    error instanceof AssistantApiError &&
    (error.assistantCode === 'oauth_required' || error.assistantCode === 'oauth_expired')
  )
}

export async function assistantFetch<T>(
  path: string,
  init: RequestInit = {},
  signal?: AbortSignal
): Promise<T> {
  const apiUrl = getAssistantApiUrl()
  if (!apiUrl) throw new Error('Assistant API URL is not configured')

  const authHeaders = await getAssistantRequestHeaders()
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  Object.entries(authHeaders).forEach(([key, value]) => headers.set(key, value))
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    signal: signal ?? init.signal,
    headers,
  })

  if (!response.ok) {
    let message = response.statusText
    let code: string | undefined
    let orgSlug: string | undefined
    try {
      const body = await response.json()
      if (body && typeof body === 'object') {
        if ('message' in body && typeof body.message === 'string') message = body.message
        else if ('error' in body && typeof body.error === 'string') message = body.error
        if ('code' in body && typeof body.code === 'string') code = body.code
        if ('org_slug' in body && typeof body.org_slug === 'string') orgSlug = body.org_slug
      }
    } catch {
      // ignore unreadable error bodies
    }
    throw new AssistantApiError(message, response.status, code, orgSlug)
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}
