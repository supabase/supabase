import { env } from "../../env.config.js";

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
  options?: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: Record<string, unknown> }
): Promise<T> {
  const storageUrl = `${env.API_URL}/storage/v1`
  
  const headers: Record<string, string> = {
    apikey: env.SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SERVICE_ROLE_KEY}`,
  }

  if (options?.body) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${storageUrl}${path}`, {
    method: options?.method ?? 'GET',
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Storage request failed (${response.status}): ${text}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : ({} as T)
}
