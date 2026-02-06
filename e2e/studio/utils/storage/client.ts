// Default Supabase CLI constants (hardcoded for local development)
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const STORAGE_URL = 'http://127.0.0.1:54321/storage/v1'

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
  const headers: Record<string, string> = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  }

  if (options?.body) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${STORAGE_URL}${path}`, {
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
