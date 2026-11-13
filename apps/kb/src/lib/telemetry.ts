import { IS_PLATFORM } from 'common/constants'
import type { TelemetryEvent } from 'common/telemetry-constants'
import { buildTelemetryEventRequest } from 'common/telemetry-event'

export const sendKbTelemetryEvent = (event: TelemetryEvent) => {
  if (!IS_PLATFORM) return
  const request = buildTelemetryEventRequest(
    process.env.NEXT_PUBLIC_API_URL ?? '',
    event,
    window.location.pathname
  )
  if (!request) return
  fetch(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Version: '2' },
    credentials: 'include',
    keepalive: request.keepalive,
    body: JSON.stringify(request.body),
  }).catch(() => {})
}
