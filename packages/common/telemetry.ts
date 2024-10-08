import { post } from './fetchWrappers'

export function handlePageTelemetry(API_URL: string, route: string, telemetryProps: any) {
  return post(`${API_URL}/telemetry/page`, {
    page_url: document.location.href,
    page_title: document.title,
    pathname: route,
    ph: {
      referrer: document.referrer,
      ...telemetryProps,
    },
  })
}
