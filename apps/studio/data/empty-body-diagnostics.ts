import type { StudioSentryContext } from '@/lib/errors/report-studio-error'
import { uuidv4 } from '@/lib/helpers'

const REFETCH_TIMEOUT_MS = 10_000

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

let isRestoredFromBfcache = false
if (typeof window !== 'undefined') {
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) isRestoredFromBfcache = true
  })
}

function readHeaders(headers: Headers) {
  return Object.fromEntries(
    RESPONSE_HEADERS.map((name) => [`header_${name.replace(/-/g, '_')}`, headers.get(name)])
  )
}

function readBrowserContext() {
  // The error context is also built when Studio fetches on the server
  if (typeof document === 'undefined' || typeof navigator === 'undefined') return {}
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
  // The caller awaits this, so bound it while still honoring the caller's own abort
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (request.signal.aborted) abort()
  request.signal.addEventListener('abort', abort, { once: true })
  const timeout = setTimeout(abort, REFETCH_TIMEOUT_MS)

  try {
    const headers = new Headers(request.headers)
    headers.set('X-Request-Id', requestId)
    const response = await fetch(
      new Request(request, { cache: 'no-store', headers, signal: controller.signal })
    )
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
  } finally {
    clearTimeout(timeout)
    request.signal.removeEventListener('abort', abort)
  }
}

function probeTags(refetch?: RefetchSummary): Record<string, string> {
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

function buildContext(request: Request, response: Response) {
  return {
    method: request.method,
    status: response.status,
    response_type: response.type,
    redirected: response.redirected,
    request_id: request.headers.get('X-Request-Id'),
    ...readHeaders(response.headers),
    ...readBrowserContext(),
    ...readResourceTiming(response.url || request.url),
  }
}

/**
 * Sentry context for the `MalformedResponse` error thrown when recovery fails: the original
 * response, browser state and the refetch probe. Empty bodies that recover aren't reported.
 */
export function emptyBodyErrorContext({
  request,
  response,
  refetch,
}: {
  request: Request
  response: Response
  refetch?: RefetchSummary
}): StudioSentryContext {
  return {
    tags: { recovered_by: 'none', ...probeTags(refetch), empty_body_diagnostic: 'true' },
    extra: { ...buildContext(request, response), ...probeExtra(refetch) },
  }
}
