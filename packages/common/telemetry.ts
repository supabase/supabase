import { post } from './fetchWrappers'

export function handlePageTelemetry(API_URL: string, route: string, telemetryProps: any) {
  return post(`${API_URL}/telemetry/page`, {
    referrer: document.referrer,
    title: document.title,
    route,
    ga: {
      screen_resolution: telemetryProps?.screenResolution,
      language: telemetryProps?.language,
    },
  })
}
