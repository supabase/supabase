import { post } from './fetchWrappers'

export function handlePageTelemetry(API_URL: string, route: string, telemetryProps: any) {
  return post(
    `${API_URL}/telemetry/page`,
    {
      page_url: window.location.href,
      page_title: document.title,
      pathname: route,
      ph: {
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        search: window.location.search,
        language: telemetryProps?.language,
        viewport_height: telemetryProps?.viewport_height,
        viewport_width: telemetryProps?.viewport_width,
      },
    },
    {
      headers: { Version: '2' },
    }
  )
}

export function handleResetTelemetry(API_URL: string) {
  return post(`${API_URL}/telemetry/reset`, {})
}
