import { API_URL } from './constants'
import { fetchHeadWithTimeout } from '@/data/fetchers'

const DEFAULT_TIMEOUT_MILLISECONDS = 2000

/**
 * Ping Postgrest for health check. Default timeout is 2s.
 *
 * @param projectRef project ref used to reach its PostgREST endpoint
 * @param options optional, include custom timeout in milliseconds
 *
 * @return true if ping is successful else false
 */
async function pingPostgrest(
  projectRef: string,
  options?: {
    timeout?: number
  }
) {
  if (projectRef === undefined) return false

  const { timeout } = options ?? {}

  return pingOpenApi(projectRef, timeout)
}

export default pingPostgrest

/**
 * Send a HEAD request to postgrest OpenAPI.
 *
 * @return true if there's no error else false
 */
async function pingOpenApi(ref: string, timeout?: number) {
  const { error } = await fetchHeadWithTimeout(`${API_URL}/projects/${ref}/api/rest`, [], {
    timeout: timeout ?? DEFAULT_TIMEOUT_MILLISECONDS,
  })
  return error === undefined
}
