import { getAssistantApiUrl } from '@/lib/ai/assistant-backend'
import { getAssistantAccessToken } from '@/lib/ai/assistant-client'
import { ResponseError } from '@/types'

export async function assistantFetch<T>(
  path: string,
  init: RequestInit = {},
  signal?: AbortSignal
): Promise<T> {
  const apiUrl = getAssistantApiUrl()
  if (!apiUrl) throw new Error('Assistant API URL is not configured')

  const token = await getAssistantAccessToken()
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  headers.set('Authorization', `Bearer ${token}`)
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
    try {
      const body = await response.json()
      if (body && typeof body === 'object') {
        if ('message' in body && typeof body.message === 'string') message = body.message
        else if ('error' in body && typeof body.error === 'string') message = body.error
      }
    } catch {
      // ignore unreadable error bodies
    }
    throw new ResponseError(message, response.status)
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}
