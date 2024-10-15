import { post } from './fetchWrappers'

export function handlePageTelemetry(API_URL: string, route: string, telemetryProps: any) {
  const { page_url, search, language, viewport_height, viewport_width } = telemetryProps
  return post(
    `${API_URL}/telemetry/page`,
    {
      page_url,
      page_title: document.title,
      pathname: route,
      ph: {
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        search,
        language,
        viewport_height,
        viewport_width,
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
