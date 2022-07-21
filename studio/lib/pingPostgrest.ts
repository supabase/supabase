import semver from 'semver'
import { headWithTimeout, getWithTimeout } from './common/fetch'
import { API_URL } from './constants'

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
  projectRef: string,
  options?: {
    kpsVersion?: string
    timeout?: number
  }
) {
  if (projectRef === undefined) return false
  const serviceApiKey = await getServiceApiKey(projectRef, options?.timeout)
  if (serviceApiKey === undefined) return false

  const { kpsVersion, timeout } = options ?? {}
  const healthCheckApiEnable = semver.gte(
    // @ts-ignore
    semver.coerce(kpsVersion ?? 'kps-v0.0.1'),
    semver.coerce('kps-v3.8.6')
  )
  if (healthCheckApiEnable) {
    const healthCheckUrl = `${restUrl.replace('/rest/', '/rest-admin/')}live`
    return pingHealthCheckApi(healthCheckUrl, serviceApiKey, timeout)
  }

  return pingOpenApi(restUrl, serviceApiKey, timeout)
}
export default pingPostgrest

const getServiceApiKey = async (
  projectRef: string,
  timeout = DEFAULT_TIMEOUT_MILLISECONDS
): Promise<string | undefined> => {
  const response = await getWithTimeout(`${API_URL}/props/project/${projectRef}/api`, { timeout })
  if (response.error || response.autoApiService.service_api_keys.length === 0) return undefined
  return response.autoApiService.serviceApiKey
}

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
