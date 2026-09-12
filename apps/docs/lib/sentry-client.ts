import type { ErrorEvent } from '@sentry/nextjs'

export function filterSentryEvent(
  event: ErrorEvent,
  { isPlatform, hasConsent }: { isPlatform: boolean; hasConsent: boolean }
) {
  if (!isPlatform || !hasConsent) return null

  const isErrorBoundaryCrash =
    event.tags?.globalErrorBoundary === true || event.tags?.globalErrorBoundary === 'true'
  const isThirdPartyOnly =
    event.tags?.third_party_code === true || event.tags?.third_party_code === 'true'

  return isThirdPartyOnly && !isErrorBoundaryCrash ? null : event
}
