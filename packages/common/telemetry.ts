import { post } from './fetchWrappers'

interface TelemetryData {
  page_url: string
  page_title: string
  pathname: string
  ph: {
    referrer: string
    language: string
    search: string
    viewport_height: number
    viewport_width: number
    user_agent: string
  }
}

export function handlePageTelemetry(API_URL: string, route: string, telemetryData: TelemetryData) {
  const { page_url } = telemetryData

  const { search, language, viewport_height, viewport_width, referrer, user_agent } =
    telemetryData.ph

  return post(
    `${API_URL}/telemetry/page`,
    {
      page_url,
      page_title: document.title,
      pathname: route,
      ph: {
        referrer: referrer ?? document.referrer,
        language,
        search,
        viewport_height,
        viewport_width,
        user_agent: user_agent ?? navigator.userAgent,
      },
    },
    { headers: { Version: '2' }, credentials: 'include' }
  )
}

export function handleResetTelemetry(API_URL: string) {
  return post(`${API_URL}/telemetry/reset`, {})
}
