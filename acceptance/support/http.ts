import { setTimeout as delay } from 'node:timers/promises'
import { getAcceptanceConfig, joinUrl } from './config'
import { createAcceptanceHeaders } from './headers'

export { createAcceptanceHeaders, withAcceptanceHeaders } from './headers'

const RETRY_DELAY_MS = 1000

export type CacheStatus = 'HIT' | 'MISS' | 'REVALIDATED' | 'BYPASS' | 'DYNAMIC' | 'EXPIRED'

export interface HttpRequestOptions<T = unknown> {
  body?: BodyInit | Record<string, unknown>
  expectedCacheStatus?: CacheStatus | CacheStatus[]
  expectedStatus?: number | number[]
  isExpectedResponse?: (response: HttpResponse<T>) => boolean
  headers?: Record<string, string>
  retries?: number
  token?: string
}

export interface HttpResponse<T = unknown> {
  body: string
  cacheStatus?: string
  headers: Headers
  json: T | undefined
  status: number
  url: string
}

export class AcceptanceHttpClient {
  constructor(private readonly baseUrl: string) {}

  async request<T = unknown>(
    method: string,
    route: string,
    options: HttpRequestOptions<T> = {}
  ): Promise<HttpResponse<T>> {
    const retries = options.retries ?? 0
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.sendRequest<T>(method, route, options)
      } catch (error) {
        if (attempt >= retries) {
          console.log(
            'AcceptanceHttpClient.request try:',
            attempt,
            ' -  error: ',
            (error as Error).message
          )
          throw error
        }
        await delay(RETRY_DELAY_MS)
      }
    }
  }

  private async sendRequest<T>(
    method: string,
    route: string,
    options: HttpRequestOptions<T>
  ): Promise<HttpResponse<T>> {
    const url = joinUrl(this.baseUrl, route)
    const headers = createAcceptanceHeaders(options.headers)

    if (options.token) {
      headers.set('authorization', `Bearer ${options.token}`)
    }

    let body = options.body
    if (body && isPlainObject(body)) {
      headers.set('content-type', headers.get('content-type') ?? 'application/json')
      body = JSON.stringify(body)
    }

    const response = await fetch(url, {
      body,
      headers,
      method,
    })

    try {
      const cacheStatus = response.headers.get('cf-cache-status') ?? undefined
      const text = response.status !== 304 ? await response.text() : ''
      const parsed = parseJson<T>(text)

      const expectedStatus = options.expectedStatus
      if (expectedStatus !== undefined && !matches(response.status, expectedStatus)) {
        throw new Error(
          [
            `Unexpected HTTP status for ${method} ${url}`,
            `expected: ${Array.isArray(expectedStatus) ? expectedStatus.join(', ') : expectedStatus}`,
            `received: ${response.status}`,
            `body: ${text}`,
          ].join('\n')
        )
      }

      const expectedCacheStatus = options.expectedCacheStatus
      if (expectedCacheStatus !== undefined && !matches(cacheStatus, expectedCacheStatus)) {
        throw new Error(
          [
            `Unexpected cache status for ${method} ${url}`,
            `expected: ${
              Array.isArray(expectedCacheStatus)
                ? expectedCacheStatus.join(', ')
                : expectedCacheStatus
            }`,
            `received: ${cacheStatus}`,
          ].join('\n')
        )
      }

      const result: HttpResponse<T> = {
        body: text,
        cacheStatus,
        headers: response.headers,
        json: parsed,
        status: response.status,
        url,
      }

      if (options.isExpectedResponse && !options.isExpectedResponse(result)) {
        throw new Error(
          [`Response did not match isExpectedResponse for ${method} ${url}`, `body: ${text}`].join(
            '\n'
          )
        )
      }

      return result
    } finally {
      if (!response.bodyUsed) {
        await response.body?.cancel()
      }
    }
  }
}

export function createRestClient() {
  return new AcceptanceHttpClient(getAcceptanceConfig().baseUrl)
}

export function createAdminClient() {
  const { adminUrl } = getAcceptanceConfig()
  if (!adminUrl) {
    throw new Error('ACCEPTANCE_ADMIN_URL is required for admin acceptance tests')
  }

  return new AcceptanceHttpClient(adminUrl)
}

function matches<T>(value: T, expected: T | T[]): boolean {
  return Array.isArray(expected) ? expected.includes(value) : value === expected
}

interface StorageError {
  statusCode: string
  error: string
  message: string
}

export function parseStorageError(payload: unknown): StorageError {
  const valid =
    payload !== null &&
    typeof payload === 'object' &&
    'statusCode' in payload &&
    'error' in payload &&
    'message' in payload
  if (!valid) {
    throw new Error('Invalid storage error payload')
  }
  return payload as StorageError
}

function parseJson<T>(text: string): T | undefined {
  if (!text) {
    return undefined
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return undefined
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}
