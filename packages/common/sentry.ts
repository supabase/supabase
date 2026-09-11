type SentryEventTags = {
  tags?: {
    globalErrorBoundary?: string | number | boolean | null
    third_party_code?: string | number | boolean | null
  }
}

export function isSentryErrorBoundaryCrash(event: SentryEventTags): boolean {
  return event.tags?.globalErrorBoundary === true || event.tags?.globalErrorBoundary === 'true'
}

export function filterSentryEvent<T extends SentryEventTags>(
  event: T,
  { isPlatform, hasConsent }: { isPlatform: boolean; hasConsent: boolean }
): T | null {
  if (!isPlatform || !hasConsent) return null

  const isThirdPartyOnly =
    event.tags?.third_party_code === true || event.tags?.third_party_code === 'true'

  return isThirdPartyOnly && !isSentryErrorBoundaryCrash(event) ? null : event
}
