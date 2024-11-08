import { headWithTimeout } from './common/fetch'
import { API_URL } from './constants'

const DEFAULT_TIMEOUT_MILLISECONDS = 2000

/**
 * Ping Postgrest for health check. Default timeout in 2s.
 *
 * @param restUrl project rest url
 * @param apikey project internal api key
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
  const { error } = await headWithTimeout(`${API_URL}/projects/${ref}/api/rest`, [], {
    timeout: timeout ?? DEFAULT_TIMEOUT_MILLISECONDS,
  })
  return error === undefined
}
