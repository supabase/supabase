import { constructHeaders, handleError } from '@/data/fetchers'
import { BASE_PATH } from '@/lib/constants'

/**
 * Minimal fetch wrapper for the self-hosted "Sites" endpoints. These routes are
 * not part of the OpenAPI spec, so we call them directly (like the AI endpoints)
 * rather than through the typed openapi-fetch client.
 */
export async function sitesApiFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = await constructHeaders(init.headers)
  const response = await fetch(`${BASE_PATH}/api${path}`, {
    credentials: 'include',
    ...init,
    headers,
  })

  if (!response.ok) {
    let body: any
    try {
      body = await response.json()
    } catch {
      // ignore non-JSON error bodies
    }
    handleError(body?.error ?? body ?? { message: `Request failed (status ${response.status})` })
  }

  try {
    return (await response.json()) as T
  } catch {
    return undefined as T
  }
}
