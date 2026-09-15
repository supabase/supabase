type SentryEventTags = {
  tags?: {
    globalErrorBoundary?: string | number | boolean | null
    third_party_code?: string | number | boolean | null
    codeSampleRate?: string | number | boolean | null
  }
}

const NON_CRASH_ERROR_SAMPLE_RATE = 0.01

export function isSentryErrorBoundaryCrash(event: SentryEventTags): boolean {
  return event.tags?.globalErrorBoundary === true || event.tags?.globalErrorBoundary === 'true'
}

export function filterSentryEvent<T extends SentryEventTags>(
  event: T,
  { isPlatform, hasConsent }: { isPlatform: boolean; hasConsent: boolean }
): T | null {
  if (!isPlatform || !hasConsent) return null

  const isErrorBoundaryCrash = isSentryErrorBoundaryCrash(event)
  const isThirdPartyOnly =
    event.tags?.third_party_code === true || event.tags?.third_party_code === 'true'

  if (isThirdPartyOnly && !isErrorBoundaryCrash) return null
  if (!isErrorBoundaryCrash && Math.random() >= NON_CRASH_ERROR_SAMPLE_RATE) return null

  event.tags = {
    ...event.tags,
    codeSampleRate: isErrorBoundaryCrash ? '1' : NON_CRASH_ERROR_SAMPLE_RATE.toString(),
  }

  return event
}

export const BROWSER_NOISE_IGNORE_ERRORS: (string | RegExp)[] = [
  // === Network / infrastructure (not actionable on FE) ===
  /504 Gateway Time-out/,
  'Network request failed',
  'Failed to fetch',
  'Load failed',
  'AbortError',
  'TypeError: cancelled',
  'TypeError: Cancelled',

  // === Browser extensions & Google Translate DOM manipulation ===
  'Node.insertBefore: Child to insert before is not a child of this node',
  'Node.removeChild: The node to be removed is not a child of this node',
  "NotFoundError: Failed to execute 'removeChild' on 'Node'",
  "NotFoundError: Failed to execute 'insertBefore' on 'Node'",
  'NotFoundError: The object can not be found here.',
  "Cannot read properties of null (reading 'parentNode')",
  "Cannot read properties of null (reading 'removeChild')",
  "TypeError: can't access dead object",
  /^NS_ERROR_/,

  // === Non-Error throws (extensions, third-party libs throwing strings/objects) ===
  'Non-Error exception captured',
  'Non-Error promise rejection captured',
  /^Object captured as exception with keys:/,

  // === Cross-origin script errors (no useful info) ===
  'Script error.',
  'Script error',
]
