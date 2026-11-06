import * as Sentry from '@sentry/nextjs'
import { IS_PLATFORM } from 'common'

import { uuidv4 } from '@/lib/helpers'

const PARAM_AFTER_SEGMENT = new Map([
  ['projects', '{ref}'],
  ['organizations', '{slug}'],
  ['branches', '{branch}'],
])

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const NUMERIC_ID_PATTERN = /^\d+$/
const LONG_ID_PATTERN = /^[A-Za-z0-9]{20,}$/

const RESPONSE_HEADERS = [
  'content-type',
  'cache-control',
  'last-modified',
  'expires',
  'content-length',
  'etag',
  'cf-ray',
  'cf-cache-status',
  'x-request-id',
]

const reportedEndpoints = new Set<string>()

let isRestoredFromBfcache = false
if (typeof window !== 'undefined') {
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) isRestoredFromBfcache = true
  })
}

export function templateEndpointPath(path: string): string {
  const [pathname = ''] = path.split(/[?#]/)
  const segments = pathname.split('/')
  return segments
    .map((segment, index) => {
      if (segment.length === 0 || segment.startsWith('{')) return segment
      const param = PARAM_AFTER_SEGMENT.get(segments[index - 1] ?? '')
      if (param) return param
      if (
        UUID_PATTERN.test(segment) ||
        NUMERIC_ID_PATTERN.test(segment) ||
        LONG_ID_PATTERN.test(segment)
      ) {
        return '{id}'
      }
      return segment
    })
    .join('/')
}

function readHeaders(headers: Headers) {
  return Object.fromEntries(
    RESPONSE_HEADERS.map((name) => [`header_${name.replace(/-/g, '_')}`, headers.get(name)])
  )
}

function readBrowserContext() {
  const navigation = performance.getEntriesByType?.('navigation')[0]
  return {
    visibility_state: document.visibilityState,
    online: navigator.onLine,
    navigation_type:
      typeof PerformanceNavigationTiming !== 'undefined' &&
      navigation instanceof PerformanceNavigationTiming
        ? navigation.type
        : null,
    ms_since_navigation_start: Math.round(performance.now()),
    restored_from_bfcache: isRestoredFromBfcache,
  }
}

function readResourceTiming(url: string) {
  const entries = performance.getEntriesByName?.(url, 'resource') ?? []
  const entry = entries[entries.length - 1]
  if (
    typeof PerformanceResourceTiming === 'undefined' ||
    !(entry instanceof PerformanceResourceTiming)
  ) {
    return { resource_timing: null }
  }
  return {
    resource_timing: {
      transfer_size: entry.transferSize,
      encoded_body_size: entry.encodedBodySize,
      decoded_body_size: entry.decodedBodySize,
      next_hop_protocol: entry.nextHopProtocol,
      response_status: 'responseStatus' in entry ? entry.responseStatus : null,
    },
  }
}

export type RefetchSummary = {
  requestId: string
  status?: number
  bodyLength?: number
  contentLength?: string | null
  contentType?: string | null
  error?: string
}

export type RecoveredBy = 'original_body' | 'refetch' | 'none'

// DOMException (e.g. AbortError) is not an `Error` instance in every runtime
function errorName(error: unknown) {
  return typeof error === 'object' && error && 'name' in error ? String(error.name) : 'unknown'
}

/**
 * Re-fetches a request bypassing the HTTP cache: the empty bodies we see on successful GETs
 * look like a browser cache revalidation bug, and a no-store request skips that path.
 * Uses plain fetch so the openapi-fetch middleware can't recurse. Never throws.
 */
export async function refetchWithoutCache(
  request: Request
): Promise<{ summary: RefetchSummary; response?: Response; body?: string }> {
  const requestId = uuidv4()
  try {
    const headers = new Headers(request.headers)
    headers.set('X-Request-Id', requestId)
    const response = await fetch(new Request(request, { cache: 'no-store', headers }))
    const buffer = await response.arrayBuffer()
    return {
      response,
      body: new TextDecoder().decode(buffer),
      summary: {
        requestId,
        status: response.status,
        bodyLength: buffer.byteLength,
        contentLength: response.headers.get('content-length'),
        contentType: response.headers.get('content-type'),
      },
    }
  } catch (error) {
    return {
      summary: { requestId, error: errorName(error) },
    }
  }
}

function probeTags(refetch?: RefetchSummary) {
  if (!refetch) return {}
  if (refetch.error) return { probe_has_body: 'error' }
  return { probe_has_body: (refetch.bodyLength ?? 0) > 0 ? 'true' : 'false' }
}

function probeExtra(refetch?: RefetchSummary) {
  if (!refetch) return {}
  return {
    probe_request_id: refetch.requestId,
    probe_status: refetch.status,
    probe_body_length: refetch.bodyLength,
    probe_content_length: refetch.contentLength,
    probe_content_type: refetch.contentType,
    probe_error: refetch.error,
  }
}

export async function reportEmptyBodyResponse({
  request,
  response,
  schemaPath,
  recoveredBy,
  refetch,
}: {
  request: Request
  response: Response
  schemaPath: string
  recoveredBy: RecoveredBy
  refetch?: RefetchSummary
}): Promise<void> {
  try {
    if (!IS_PLATFORM || request.method !== 'GET') return

    const endpoint = templateEndpointPath(schemaPath)
    if (reportedEndpoints.has(endpoint)) return
    reportedEndpoints.add(endpoint)

    const context = {
      method: request.method,
      status: response.status,
      response_type: response.type,
      redirected: response.redirected,
      request_id: request.headers.get('X-Request-Id'),
      ...readHeaders(response.headers),
      ...readBrowserContext(),
      ...readResourceTiming(response.url || request.url),
    }

    Sentry.captureMessage('Empty response body on successful API request', {
      level: 'warning',
      fingerprint: ['empty-body-response', endpoint],
      tags: {
        endpoint,
        recovered_by: recoveredBy,
        ...probeTags(refetch),
        empty_body_diagnostic: 'true',
      },
      extra: { ...context, ...probeExtra(refetch) },
    })
  } catch (error) {
    console.error('Failed to report empty response body', error)
  }
}
