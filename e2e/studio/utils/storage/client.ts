import { env } from '../../env.config.js'

/**
 * Make an HTTP request to the local Supabase Storage API.
 *
 * @param path - The path to append to the storage base URL (e.g., '/bucket')
 * @param options - Optional method and body
 * @returns Parsed JSON response
 * @throws Error if the request fails
 */
export async function storageRequest<T>(
  path: string,
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    /** A JSON payload, or a string to send as a raw `text/plain` body (for object uploads) */
    body?: Record<string, unknown> | string
  }
): Promise<T> {
  const storageUrl = `${env.API_URL}/storage/v1`

  const headers: Record<string, string> = {
    apikey: env.SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SERVICE_ROLE_KEY}`,
  }

  const isRawBody = typeof options?.body === 'string'
  if (options?.body !== undefined) {
    headers['Content-Type'] = isRawBody ? 'text/plain' : 'application/json'
  }

  const response = await fetch(`${storageUrl}${path}`, {
    method: options?.method ?? 'GET',
    headers,
    body: isRawBody
      ? (options!.body as string)
      : options?.body
        ? JSON.stringify(options.body)
        : undefined,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Storage request failed (${response.status}): ${text}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : ({} as T)
}
