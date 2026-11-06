import type { components } from 'api-types'

import { hasConsented } from './consent-state'
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

// no auth imports here: apps without a dashboard session (kb) send events through this
export function buildTelemetryEventRequest(
  API_URL: string,
  event: TelemetryEvent,
  pathname?: string
) {
  if (!hasConsented()) return null

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

  return {
    url: `${ensurePlatformSuffix(API_URL)}/telemetry/event`,
    body,
    keepalive: KEEPALIVE_ACTIONS.has(event.action),
  }
}
