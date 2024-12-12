import { post } from './fetchWrappers'

export function handlePageTelemetry(API_URL: string, route: string, telemetryProps: any) {
  const { page_url } = telemetryProps

  // check if ph exists, if not use an empty object
  const ph = telemetryProps?.ph || {}
  const { search = '', language = '', viewport_height = 0, viewport_width = 0 } = ph

  return post(
    `${API_URL}/telemetry/page`,
    {
      page_url,
      page_title: document.title,
      pathname: route,
      ph: {
        referrer: document.referrer,
        language,
        search,
        viewport_height,
        viewport_width,
        user_agent: navigator.userAgent,
      },
    },
    { headers: { Version: '2' }, credentials: 'include' }
  )
}

export function handleResetTelemetry(API_URL: string) {
  return post(`${API_URL}/telemetry/reset`, {})
}
