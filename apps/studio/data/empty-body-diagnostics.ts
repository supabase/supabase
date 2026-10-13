import * as Sentry from '@sentry/nextjs'
import { IS_PLATFORM } from 'common'

import { uuidv4 } from '@/lib/helpers'

const PROBE_TIMEOUT_MS = 10_000

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

async function probe(request: Request) {
  const headers = new Headers(request.headers)
  const probeRequestId = uuidv4()
  headers.set('X-Request-Id', probeRequestId)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)

  try {
    // Plain fetch so the probe skips the openapi-fetch middleware (and can't recurse)
    const response = await fetch(
      new Request(request, { cache: 'no-store', headers, signal: controller.signal })
    )
    // Only the length: these endpoints can return API keys and secrets
    const bodyLength = (await response.arrayBuffer()).byteLength
    return {
      probe_has_body: bodyLength > 0 ? 'true' : 'false',
      probe_request_id: probeRequestId,
      probe_status: response.status,
      probe_body_length: bodyLength,
      probe_content_length: response.headers.get('content-length'),
      probe_content_type: response.headers.get('content-type'),
    }
  } catch (error) {
    return {
      probe_has_body: 'error',
      probe_request_id: probeRequestId,
      probe_error: error instanceof Error ? error.name : 'unknown',
    }
  } finally {
    clearTimeout(timeout)
  }
}

export async function reportEmptyBodyResponse({
  request,
  response,
  schemaPath,
}: {
  request: Request
  response: Response
  schemaPath: string
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
    const { probe_has_body, ...probeContext } = await probe(request)

    Sentry.captureMessage('Empty response body on successful API request', {
      level: 'warning',
      fingerprint: ['empty-body-response', endpoint],
      tags: { endpoint, probe_has_body, empty_body_diagnostic: 'true' },
      extra: { ...context, ...probeContext },
    })
  } catch (error) {
    console.error('Failed to report empty response body', error)
  }
}
