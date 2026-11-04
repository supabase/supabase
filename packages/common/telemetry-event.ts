import type { components } from 'api-types'

import { hasConsented } from './consent-state'
import { post } from './fetchWrappers'
import { ensurePlatformSuffix } from './helpers'
import type { TelemetryEvent } from './telemetry-constants'
import { getSharedTelemetryData } from './telemetry-utils'

type EventBody = components['schemas']['TelemetryEventBodyV2']

const KEEPALIVE_ACTIONS = new Set<TelemetryEvent['action']>([
  'sign_in_submitted',
  'sign_in_button_clicked',
  'start_project_button_clicked',
  'www_pricing_plan_cta_clicked',
  'example_link_clicked',
  'kb_search_result_clicked',
])

export function sendTelemetryEvent(API_URL: string, event: TelemetryEvent, pathname?: string) {
  const consent = hasConsented()
  if (!consent) return

  const body: EventBody = {
    ...getSharedTelemetryData(pathname),
    action: event.action,
    custom_properties: 'properties' in event ? event.properties : {},
    groups: 'groups' in event ? { ...event.groups } : {},
  }

  if (event.action.startsWith('explorer_')) body.page_title = 'Explorer'

  if (body.groups?.project === 'Unknown') {
    delete body.groups.project
    if (body.groups?.organization === 'Unknown') {
      delete body.groups
    }
  }

  // keepalive lets the request survive a navigation that starts right after
  // the event (the OAuth redirect after sign_in_submitted, a plain-link click
  // into the dashboard), but keepalive requests share a ~64KB in-flight quota
  // page-wide, so it stays scoped to those events. Callers like useTrack
  // fire-and-forget, so rejections are handled here rather than surfacing
  // as unhandled promise rejections.
  return post(`${ensurePlatformSuffix(API_URL)}/telemetry/event`, body, {
    headers: { Version: '2' },
    keepalive: KEEPALIVE_ACTIONS.has(event.action),
  }).catch((error) => {
    console.error('Problem sending telemetry event:', error)
  })
}
