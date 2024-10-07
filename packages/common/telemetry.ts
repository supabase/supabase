import { post } from './fetchWrappers'

export function handlePageTelemetry(API_URL: string, route: string, telemetryProps: any) {
  return post(`${API_URL}/telemetry/page`, {
    pageUrl: document.location.href,
    pageTitle: document.title,
    pathname: route,
    ph: {
      referrer: document.referrer,
      ...telemetryProps,
    },
  })
}
