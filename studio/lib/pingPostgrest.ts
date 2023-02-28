import semver from 'semver'
import { headWithTimeout, getWithTimeout } from './common/fetch'
import { API_URL } from './constants'

const DEFAULT_TIMEOUT_MILLISECONDS = 2000

/**
 * Ping Postgrest for health check. Default timeout in 2s.
 *
 * Project with version gte 'kps-v3.8.6', we can ping the health-check api
 * else ping the OpenApi url
 *
 * @param restUrl project rest url
 * @param apikey project internal api key
 * @param options optional, include project kpsVersion or custom timeout in milliseconds
 *
 * @return true if ping is successful else false
 */
async function pingPostgrest(
  projectRef: string,
  options?: {
    kpsVersion?: string
    timeout?: number
  }
) {
  if (projectRef === undefined) return false

  const { kpsVersion, timeout } = options ?? {}
  const healthCheckApiEnable = semver.gte(
    // @ts-ignore
    semver.coerce(kpsVersion ?? 'kps-v0.0.1'),
    semver.coerce('kps-v3.8.6')
  )
  if (healthCheckApiEnable) {
    return pingHealthCheckApi(projectRef, timeout)
  } else {
    return pingOpenApi(projectRef, timeout)
  }
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

/**
 * Send a GET request to postgrest health check api.
 *
 * @return true if there's no error else false
 */
async function pingHealthCheckApi(ref: string, timeout?: number) {
  const { error } = await getWithTimeout(`${API_URL}/projects/${ref}/live`, {
    timeout: timeout ?? DEFAULT_TIMEOUT_MILLISECONDS,
  })
  return error === undefined
}
