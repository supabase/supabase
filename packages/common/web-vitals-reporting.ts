'use client'

import { useEffect } from 'react'
import type { Metric } from 'web-vitals'

import { sendTelemetryEvent } from './telemetry'

// web-vitals has no unsubscribe, so observers are registered once per page load.
// Consent is re-checked at send time (see buildTelemetryEventRequest), so reports
// are dropped if consent is revoked after registration.
let hasRegisteredObservers = false

// The metrics describe the page load, so they belong to the page it started on. That page
// is recorded on first mount, before consent, because consent can arrive after the user
// has navigated elsewhere.
let landingPathname: string | undefined

function reportWebVital(apiUrl: string, pathname: string, metric: Metric) {
  sendTelemetryEvent(
    apiUrl,
    {
      action: 'web_vital_evaluated',
      properties: {
        metricName: metric.name,
        metricValue: metric.value,
        metricRating: metric.rating,
        metricId: metric.id,
        navigationType: metric.navigationType,
      },
    },
    pathname
  )
}

/**
 * Reports LCP, CLS, INP, TTFB and FCP for the current page load as `web_vital_evaluated`
 * telemetry events.
 *
 * Nothing is loaded or observed until `enabled` is true, so pass the consent state. The
 * observers are buffered, so enabling after the page has loaded still reports its values.
 */
export function useWebVitalsReporting({ apiUrl, enabled }: { apiUrl: string; enabled: boolean }) {
  useEffect(() => {
    // Only reads the location; nothing is observed or sent until consent
    landingPathname ??= window.location.pathname

    if (!enabled || hasRegisteredObservers) return

    hasRegisteredObservers = true
    const pathname = landingPathname

    import('web-vitals')
      .then(({ onLCP, onCLS, onINP, onTTFB, onFCP }) => {
        const report = (metric: Metric) => reportWebVital(apiUrl, pathname, metric)

        onLCP(report)
        onCLS(report)
        onINP(report)
        onTTFB(report)
        onFCP(report)
      })
      .catch((error) => {
        // e.g. a chunk load failure; allow the next enable to retry
        hasRegisteredObservers = false
        console.error('Problem registering web vitals reporting:', error)
      })
  }, [apiUrl, enabled])
}
