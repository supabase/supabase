import { useRouter } from '@tanstack/react-router'
import { consentState, sendTelemetryEvent } from 'common'
import { useEffect } from 'react'
import { useSnapshot } from 'valtio'

import {
  requestTimingCollector,
  type RequestTimingCollector,
  type RouteRequestsSummary,
} from './request-timing-collector'
import { toRouteTemplate } from './route-template.utils'
import { useLatest } from '@/hooks/misc/useLatest'

function sendSummary(apiUrl: string, summary: RouteRequestsSummary) {
  // The route template is sent as the pathname so the event never carries a project ref there
  sendTelemetryEvent(
    apiUrl,
    { action: 'route_requests_evaluated', properties: summary },
    summary.routeTemplate
  )
}

/**
 * Sends one `route_requests_evaluated` event per route visit, for the page loads that were
 * sampled (see `REQUEST_TIMING_SAMPLE_RATE`).
 *
 * Timings are tallied in memory from the start of the page load, before consent is known, so
 * the initial load is complete. Nothing is sent until the user has accepted. If they deny,
 * everything held is discarded and recording stops.
 *
 * A visit ends when the pathname changes (query-only changes, such as filters kept in the URL,
 * stay in the same visit) and when the tab is hidden, since that may be the last chance to send.
 */
export function useRouteRequestTelemetry({
  apiUrl,
  collector = requestTimingCollector,
}: {
  apiUrl: string
  /** The page load's collector. Only tests pass another, to control what is sampled. */
  collector?: RequestTimingCollector
}) {
  const router = useRouter()
  const { hasConsented, isResolved, showConsentToast } = useSnapshot(consentState)

  // The consent state settles without a decision while the banner is still up, so "resolved and
  // not consented" alone is not a denial
  const isConsentDenied = isResolved && !hasConsented && !showConsentToast

  const apiUrlRef = useLatest(apiUrl)
  const hasConsentedRef = useLatest(hasConsented)

  useEffect(() => {
    if (isConsentDenied) collector.discardAndPause()
    else collector.resume()
  }, [collector, isConsentDenied])

  // Visits that finished before consent was given
  useEffect(() => {
    if (!hasConsented) return

    collector.drainQueuedSummaries().forEach((summary) => sendSummary(apiUrlRef.current, summary))
  }, [collector, hasConsented, apiUrlRef])

  useEffect(() => {
    if (!collector.isSampled) return

    const setRouteTemplate = () => {
      const leafMatch = router.state.matches[router.state.matches.length - 1]
      if (leafMatch) collector.setRouteTemplate(toRouteTemplate(leafMatch.fullPath))
    }
    setRouteTemplate()

    const endVisit = (next?: { resumedAfterHidden: boolean }) => {
      const summary = collector.finishVisit(next)
      if (!summary) return

      if (hasConsentedRef.current) sendSummary(apiUrlRef.current, summary)
      else collector.queueSummary(summary)
    }

    const unsubscribeResolved = router.subscribe('onResolved', ({ fromLocation, pathChanged }) => {
      // The first resolve of a page load has no previous location, and a change that only
      // touches the query string stays in the same visit
      if (fromLocation && pathChanged) endVisit()
      setRouteTemplate()
    })

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') endVisit({ resumedAfterHidden: true })
    }
    const handlePageHide = () => endVisit({ resumedAfterHidden: true })

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      unsubscribeResolved()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [collector, router, hasConsentedRef, apiUrlRef])
}
