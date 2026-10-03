import type { IncomingHttpHeaders } from 'node:http'

export const SUPABASE_REQUEST_ID_HEADER = 'sb-request-id'
export const TRACEPARENT_HEADER = 'traceparent'

// W3C traceparent: version "-" trace-id "-" parent-id "-" flags, all lowercase hex.
// Version ff and all-zero ids are invalid; future versions may append extra fields.
const TRACEPARENT_PATTERN =
  /^(?!ff)[\da-f]{2}-(?!0{32})[\da-f]{32}-(?!0{16})[\da-f]{16}-[\da-f]{2}(?:-.*)?$/
const TRACEPARENT_V0_LENGTH = 55

export function getSbReqId(headers: IncomingHttpHeaders): string | undefined {
  const sbReqId = headers[SUPABASE_REQUEST_ID_HEADER]

  return getNonEmptyString(sbReqId)
}

export function getValidTraceparent(headers: IncomingHttpHeaders): string | undefined {
  const traceparent = headers[TRACEPARENT_HEADER]

  if (
    typeof traceparent !== 'string' ||
    (traceparent.length > TRACEPARENT_V0_LENGTH && traceparent.startsWith('00-')) ||
    !TRACEPARENT_PATTERN.test(traceparent)
  ) {
    return undefined
  }

  return traceparent
}

export function getSbReqIdFromPayload(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined
  }

  const directSbReqId = getNonEmptyString((payload as { sbReqId?: unknown }).sbReqId)

  if (directSbReqId) {
    return directSbReqId
  }

  // Webhook payloads wrap the original event under `event.payload`
  // every other job carries sbReqId at the top level.
  const nestedSbReqId = getNonEmptyString(
    (payload as { event?: { payload?: { sbReqId?: unknown } } }).event?.payload?.sbReqId
  )

  return nestedSbReqId
}

function getNonEmptyString(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return getNonEmptyString(value[0])
  }

  if (typeof value !== 'string' || value.length === 0) {
    return undefined
  }

  return value
}
