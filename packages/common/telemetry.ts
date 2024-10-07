import { post } from './fetchWrappers'

export function handlePageTelemetry(API_URL: string, route: string, telemetryProps: any) {
  return post(`${API_URL}/telemetry/page`, {
    page_url: document.location.href,
    page_title: document.title,
    pathname: route,
    ph: {
      referrer: document.referrer,
      language: telemetryProps.language,
      user_agent: telemetryProps.userAgent,
      search: telemetryProps.search,
      viewport_height: telemetryProps.viewportHeight,
      viewport_width: telemetryProps.viewportWidth,
    },
  })
}
