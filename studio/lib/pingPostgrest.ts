import semver from 'semver'
import { headWithTimeout, getWithTimeout } from './common/fetch'

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
  restUrl: string,
  apikey: string,
  options?: {
    kpsVersion?: string
    timeout?: number
  }
) {
  const { kpsVersion, timeout } = options ?? {}
  const healthCheckApiEnable = semver.gte(
    // @ts-ignore
    semver.coerce(kpsVersion ?? 'kps-v0.0.1'),
    semver.coerce('kps-v3.8.6')
  )
  if (healthCheckApiEnable) {
    const healthCheckUrl = `${restUrl.replace('/rest/', '/rest-admin/')}live`
    return pingHealthCheckApi(healthCheckUrl, apikey, timeout)
  }

  return pingOpenApi(restUrl, apikey, timeout)
}
export default pingPostgrest

const DEFAULT_TIMEOUT_MILLISECONDS = 2000

/**
 * Send a HEAD request to postgrest OpenAPI.
 *
 * @return true if there's no error else false
 */
async function pingOpenApi(url: string, apikey: string, timeout?: number) {
  const headers = { apikey, Authorization: `Bearer ${apikey}` }
  const { error } = await headWithTimeout(url, [], {
    headers,
    credentials: 'omit',
    timeout: timeout ?? DEFAULT_TIMEOUT_MILLISECONDS,
  })
  return error === undefined
}

/**
 * Send a GET request to postgrest health check api.
 *
 * @return true if there's no error else false
 */
async function pingHealthCheckApi(url: string, apikey: string, timeout?: number) {
  const headers = { apikey }
  const { error } = await getWithTimeout(url, {
    headers,
    credentials: 'omit',
    timeout: timeout ?? DEFAULT_TIMEOUT_MILLISECONDS,
  })
  return error === undefined
}
