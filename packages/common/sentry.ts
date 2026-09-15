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
