import type { components } from 'api-types'

import { hasConsented } from './consent-state'
import { ensurePlatformSuffix } from './helpers'
import { posthogClient } from './posthog-client'
import type { TelemetryEvent } from './telemetry-constants'
import { getSharedTelemetryData, getTelemetryPlatform } from './telemetry-utils'

type EventBody = components['schemas']['TelemetryEventBodyV2']

const KEEPALIVE_ACTIONS = new Set<TelemetryEvent['action']>([
  'sign_in_submitted',
  'sign_in_button_clicked',
  'start_project_button_clicked',
  'www_pricing_plan_cta_clicked',
  'example_link_clicked',
  'kb_search_result_clicked',
  'kb_search_closed',
  'agent_setup_clicked',
  'view_as_markdown_clicked',
])

let featureFlagProperties: Record<string, unknown> = {}

export function setTelemetryFeatureFlags(flags: Record<string, unknown>) {
  featureFlagProperties = Object.fromEntries(
    Object.entries(flags).map(([key, value]) => [`$feature/${key}`, value])
  )
}

// no auth imports here: apps without a dashboard session (kb) send events through this
export function buildTelemetryEventRequest(
  API_URL: string,
  event: TelemetryEvent,
  pathname?: string
) {
  if (!hasConsented()) return null

  const platform = getTelemetryPlatform()
  const liveSessionId = posthogClient.refreshSessionId()
  const body: EventBody = {
    ...getSharedTelemetryData(pathname),
    ...(liveSessionId && { session_id: liveSessionId }),
    action: event.action,
    custom_properties: {
      ...featureFlagProperties,
      ...('properties' in event ? event.properties : {}),
      ...(platform && { platform }),
    },
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
