import { DEFAULT_PLATFORM_APPLICATION_NAME } from '@supabase/pg-meta/src/constants'
import { getAccessToken, IS_PLATFORM } from 'common'
import createClient from 'openapi-fetch'

import type { paths } from './api'
import { reportEmptyBodyResponse } from './empty-body-diagnostics'
import {
  classifyError,
  classifyResponseError,
  parseResponseErrorBody,
} from './error-classification'
import { guardMethod, type GuardedClientMethod } from './guarded-fetch'
import { API_URL } from '@/lib/constants'
import {
  deferStudioErrorReport,
  reportStudioError,
  type StudioSentryContext,
} from '@/lib/errors/report-studio-error'
import type { StudioError } from '@/lib/errors/studio-errors'
import { uuidv4 } from '@/lib/helpers'

// generated from openapi-typescript

const DEFAULT_HEADERS = { Accept: 'application/json' }

export const fetchHandler: typeof fetch = async (input, init) => {
  try {
    return await fetch(input, init)
  } catch (err: any) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      console.error(err)
      throw new Error('Unable to reach the server. Please check your network or try again later.')
    }
    throw err
  }
}

export const client = createClient<paths>({
  fetch: fetchHandler,
  // [Joshen] Just FYI, the replace is temporary until we update env vars API_URL to remove /platform or /v1 - should just be the base URL
  baseUrl: API_URL?.replace('/platform', ''),
  referrerPolicy: 'no-referrer-when-downgrade',
  headers: DEFAULT_HEADERS,
  credentials: 'include',
  querySerializer: {
    array: {
      style: 'form',
      explode: false,
    },
  },
})

export function isValidConnString(connString?: string | null) {
  // If there is no `connectionString` on platform, pg-meta will necessarily fail to connect to the target database.
  // This only applies if IS_PLATFORM is true; otherwise (test/local-dev), pg-meta won't need this parameter
  // and will connect to the locally running DB_URL instead.
  return IS_PLATFORM ? Boolean(connString) : true
}

export async function constructHeaders(headersInit?: HeadersInit | undefined) {
  const requestId = uuidv4()
  const headers = new Headers(headersInit)

  headers.set('X-Request-Id', requestId)

  if (!headers.has('Authorization')) {
    const accessToken = await getAccessToken()
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  }

  return headers
}

/**
 * openapi-fetch only treats a response body as empty when `status === 204` or the
 * response carries a `Content-Length: 0` header; otherwise it calls `response.json()`,
 * which throws "Unexpected end of JSON input" on an empty body. HTTP/3 (and HEAD
 * requests) may omit `Content-Length: 0` on empty-body responses — e.g. a `201` with
 * no body — so a request that succeeds over HTTP/2 can fail over HTTP/3.
 *
 * Normalize empty-body success responses by setting `Content-Length: 0` so the parser
 * short-circuits regardless of transport. Non-empty responses are returned untouched.
 */
export async function normalizeEmptyBodyResponse(
  response: Response,
  source?: { request: Request; schemaPath: string }
): Promise<Response> {
  if (response.status === 204) {
    return response
  }

  if (response.headers.has('Content-Length')) {
    if (source && response.headers.get('Content-Length') === '0') {
      void reportEmptyBodyResponse({ ...source, response })
    }
    return response
  }

  const body = await response.clone().text()
  if (body.length > 0) {
    return response
  }

  if (source) void reportEmptyBodyResponse({ ...source, response })

  const headers = new Headers(response.headers)
  headers.set('Content-Length', '0')
  return new Response(null, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function pgMetaGuard(request: Request) {
  // Only check for /platform/pg-meta/ endpoints
  if (request.url.includes('/platform/pg-meta/')) {
    // If there is no valid `x-connection-encrypted`, pg-meta will necesseraly fail to connect to the target database
    // in such case, we save the hops and throw a 421 response instead
    if (!isValidConnString(request.headers.get('x-connection-encrypted'))) {
      const retryAfterHeader = request.headers.get('Retry-After')
      throw classifyResponseError({
        message: 'API Error: happened while trying to acquire connection to the database',
        code: 400,
        requestId: request.headers.get('X-Request-Id') ?? undefined,
        retryAfter: retryAfterHeader ? parseInt(retryAfterHeader) : undefined,
      })
    }
    if (!request.headers.get('x-pg-application-name')) {
      request.headers.set('x-pg-application-name', DEFAULT_PLATFORM_APPLICATION_NAME)
    }
  }
  return request
}

// Middleware
client.use(
  {
    // Middleware to add authorization headers to the request
    async onRequest({ request }) {
      const headers = await constructHeaders()
      headers.forEach((value, key) => request.headers.set(key, value))
      return pgMetaGuard(request)
    },
  },
  {
    // Middleware to format errors
    async onResponse({ request, response, schemaPath }) {
      if (response.ok) {
        return normalizeEmptyBodyResponse(response, { request, schemaPath })
      }

      // handle errors
      try {
        // attempt to parse the response body as JSON
        let body = await response.clone().json()

        // add code field to body
        body.code = response.status

        body.requestId = request.headers.get('X-Request-Id')

        const retryAfterHeader =
          response.headers.get('Retry-After') ?? response.headers.get('X-RateLimit-Reset')
        body.retryAfter = retryAfterHeader ? parseInt(retryAfterHeader) : undefined

        const requestUrl = new URL(request.url)
        body.requestPathname = requestUrl.pathname

        return new Response(JSON.stringify(body), {
          headers: response.headers,
          status: response.status,
          statusText: response.statusText,
        })
      } catch {
        // noop
      }

      return response
    },
  }
)

export const get = guardMethod('get', client.GET) as GuardedClientMethod<paths, 'get'>
export const post = guardMethod('post', client.POST) as GuardedClientMethod<paths, 'post'>
export const put = guardMethod('put', client.PUT) as GuardedClientMethod<paths, 'put'>
export const patch = guardMethod('patch', client.PATCH) as GuardedClientMethod<paths, 'patch'>
export const del = guardMethod('delete', client.DELETE) as GuardedClientMethod<paths, 'delete'>
export const { HEAD: head, TRACE: trace, OPTIONS: options } = client

export { unguarded, type Unguarded } from './guarded-fetch'

type HandleErrorOptions = {
  alwaysCapture?: boolean
  sentryContext?: StudioSentryContext
  /**
   * For callers outside React Query. Inside queries and mutations the query cache reports the
   * error after the last retry, so leave this unset there.
   */
  reportImmediately?: boolean
}

/**
 * Classifies an error (API response bodies by status and pattern) and throws it. Query and mutation
 * functions call this so React Query receives a tagged error in its `error` state. Reporting to
 * Sentry follows the error's routing (or always, with `alwaysCapture`). It happens in the query
 * cache after the last retry, or right away with `reportImmediately`.
 */
export const handleError = (error: unknown, options: HandleErrorOptions = {}): never => {
  const raw = parseResponseErrorBody(error)
  const classified = raw ? classifyResponseError(raw) : classifyError(error)
  if (options.reportImmediately) {
    reportStudioError(classified, options.sentryContext, { force: options.alwaysCapture })
  } else {
    deferStudioErrorReport(classified, {
      context: options.sentryContext,
      force: options.alwaysCapture,
    })
  }
  throw classified
}

// [Joshen] The methods below are brought over from lib/common/fetch because we still need them
// primarily for our own endpoints in the dashboard repo. So consolidating all the fetch methods into here.

async function handleFetchResponse<T>(response: Response): Promise<T | StudioError> {
  const contentType = response.headers.get('Content-Type')
  if (contentType === 'application/octet-stream') return response as any
  try {
    const resTxt = await response.text()
    try {
      // try to parse response text as json
      return JSON.parse(resTxt)
    } catch (err) {
      // return as text plain
      return resTxt as any
    }
  } catch (e) {
    return handleError(response, { reportImmediately: true }) as T | StudioError
  }
}

async function handleFetchHeadResponse<T>(
  response: Response,
  headers: string[]
): Promise<T | StudioError> {
  try {
    const res = {} as any
    headers.forEach((header: string) => {
      res[header] = response.headers.get(header)
    })
    return res
  } catch (e) {
    return handleError(response, { reportImmediately: true }) as T | StudioError
  }
}

async function handleFetchError(response: unknown): Promise<StudioError> {
  let error: StudioError

  if (response instanceof Response) {
    error = await classifyFetchResponse(response)
  } else {
    // No response to read, e.g. a fetch failure or an aborted request
    error = classifyError(response)
  }

  // @ts-expect-error - [Alaister] many of our local api routes check `if (response.error)`.
  // This is a fix to keep those checks working without breaking changes.
  // In future we should check for `if (isStudioError(response))` instead.
  error.error = error

  return error
}

async function classifyFetchResponse(response: Response): Promise<StudioError> {
  const resJson: any = await response.json()
  const status = response.status

  const message =
    resJson.message ?? resJson.msg ?? resJson.error ?? `An error has occurred: ${status}`
  const retryAfterHeader =
    response.headers.get('Retry-After') ?? response.headers.get('X-RateLimit-Reset')
  const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader) : undefined

  return classifyResponseError({ message, code: status, retryAfter })
}

/**
 * To be used only for dashboard API endpoints. Use `fetch` directly if calling a non dashboard API endpoint
 */
export async function fetchGet<T = any>(
  url: string,
  options?: { [prop: string]: any }
): Promise<T | StudioError> {
  try {
    const { headers: otherHeaders, abortSignal, ...otherOptions } = options ?? {}
    const headers = await constructHeaders({
      'Content-Type': 'application/json',
      ...DEFAULT_HEADERS,
      ...otherHeaders,
    })
    const response = await fetch(url, {
      headers,
      method: 'GET',
      referrerPolicy: 'no-referrer-when-downgrade',
      ...otherOptions,
      signal: abortSignal,
    })
    if (!response.ok) return handleFetchError(response)
    return handleFetchResponse(response)
  } catch (error) {
    return handleFetchError(error)
  }
}

/**
 * To be used only for dashboard API endpoints. Use `fetch` directly if calling a non dashboard API endpoint
 *
 * Exception for `bucket-object-download-mutation` as openapi-fetch doesn't support octet-stream responses
 */
export async function fetchPost<T = any>(
  url: string,
  data: { [prop: string]: any },
  options?: { [prop: string]: any }
): Promise<T | StudioError> {
  try {
    const { headers: otherHeaders, abortSignal, ...otherOptions } = options ?? {}
    const headers = await constructHeaders({
      'Content-Type': 'application/json',
      ...DEFAULT_HEADERS,
      ...otherHeaders,
    })
    const response = await fetch(url, {
      headers,
      method: 'POST',
      body: JSON.stringify(data),
      referrerPolicy: 'no-referrer-when-downgrade',
      ...otherOptions,
      signal: abortSignal,
    })
    if (!response.ok) return handleFetchError(response)
    return handleFetchResponse(response)
  } catch (error) {
    return handleFetchError(error)
  }
}

/**
 * To be used only for dashboard API endpoints. Use `fetch` directly if calling a non dashboard API endpoint
 */
export async function fetchHeadWithTimeout<T = any>(
  url: string,
  headersToRetrieve: string[],
  options?: { [prop: string]: any }
): Promise<T | StudioError> {
  try {
    const timeout = options?.timeout ?? 60000

    const { headers: otherHeaders, abortSignal, ...otherOptions } = options ?? {}
    const headers = await constructHeaders({
      'Content-Type': 'application/json',
      ...DEFAULT_HEADERS,
      ...otherHeaders,
    })

    const response = await fetch(url, {
      method: 'HEAD',
      referrerPolicy: 'no-referrer-when-downgrade',
      headers,
      ...otherOptions,
      signal: AbortSignal.timeout(timeout),
    })

    if (!response.ok) return handleFetchError(response)
    return handleFetchHeadResponse(response, headersToRetrieve)
  } catch (error) {
    return handleFetchError(error)
  }
}
