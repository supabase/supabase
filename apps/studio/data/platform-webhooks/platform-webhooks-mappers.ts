import type { operations } from 'api-types'
import * as z from 'zod'

import type { WebhookEndpointAttributesInput, WebhookEventType } from './platform-webhooks-fetchers'
import { PLATFORM_WEBHOOK_EVENT_TYPES } from '@/components/interfaces/Platform/Webhooks/PlatformWebhooks.constants'
import type {
  UpsertWebhookEndpointInput,
  WebhookDelivery,
  WebhookEndpoint,
} from '@/components/interfaces/Platform/Webhooks/PlatformWebhooks.types'

// '*' (subscribe to all) is handled separately by the form's "subscribe all" toggle,
// so it's not part of the selectable catalog, but it's still a value the API accepts.
const webhookEventTypeSchema = z.enum([...PLATFORM_WEBHOOK_EVENT_TYPES, '*'])

// Drop (rather than throw on) event types our client catalog doesn't recognize —
// e.g. the backend added one after this build shipped. Throwing here would make
// editing any endpoint using it impossible until the client catalog catches up.
const toWebhookEventTypes = (eventTypes: string[]): { type: WebhookEventType }[] =>
  eventTypes
    .map((eventType) => webhookEventTypeSchema.safeParse(eventType))
    .filter((result) => result.success)
    .map((result) => ({ type: result.data }))

// Send `{}` rather than `null` for "no headers" — the OpenAPI spec allows `null` here,
// but the backend's `custom_headers` column is NOT NULL and rejects it (observed as a
// 500 / `23502` constraint violation when updating an endpoint with no headers).
const toCustomHeaders = (headers: Array<{ key: string; value: string }>): Record<string, string> =>
  Object.fromEntries(headers.map((header) => [header.key, header.value]))

// The real API has no `name` field on an endpoint — it is never sent here.
// See the comment on `WebhookEndpoint.name` in PlatformWebhooks.types.ts.
export const toWebhookEndpointAttributes = (
  input: UpsertWebhookEndpointInput
): WebhookEndpointAttributesInput => ({
  url: input.url,
  description: input.description || null,
  enabled: input.enabled,
  event_types: toWebhookEventTypes(input.eventTypes),
  custom_headers: toCustomHeaders(input.customHeaders),
  signing_secret: input.signingSecret || undefined,
})

type WebhookEndpointResource =
  operations['v2-organizations-slug-webhooks-endpoints-id-get']['responses'][200]['content']['application/json']['data']

// The single-delivery endpoint — includes the full nested `event` (type + payload).
type WebhookDeliveryResource =
  operations['v2-organizations-slug-webhooks-deliveries-id-get']['responses'][200]['content']['application/json']['data']

// The deliveries-list-for-an-endpoint endpoint — lighter weight, no `event` at all.
type WebhookDeliveryListItemResource =
  operations['v2-organizations-slug-webhooks-endpoints-id-deliveries-get']['responses'][200]['content']['application/json']['data'][number]

// Response → UI direction. The real API never returns a `name` — `name` is left blank
// here; until the backend adds a field for it, there's nowhere to read a saved name
// back from. Flagged with Ali/Paweł as an open product question, not yet resolved.
export const toWebhookEndpoint = (resource: WebhookEndpointResource): WebhookEndpoint => ({
  id: resource.id,
  name: '',
  url: resource.attributes.url,
  description: resource.attributes.description ?? '',
  enabled: resource.attributes.enabled,
  eventTypes: resource.attributes.event_types.map((eventType) => eventType.type),
  // The API stores headers as a `{ key: value }` object with no ids of its own —
  // the key doubles as the id here since it's already unique within the object.
  customHeaders: Object.entries(resource.attributes.custom_headers ?? {}).map(([key, value]) => ({
    id: key,
    key,
    value,
  })),
  createdBy: resource.attributes.created_by,
  createdAt: resource.attributes.created_at,
})

export const toWebhookDelivery = (
  resource: WebhookDeliveryResource,
  endpointId: string
): WebhookDelivery => ({
  id: resource.id,
  endpointId,
  eventId: resource.attributes.event_id,
  eventType: resource.attributes.event.type,
  eventPayload: resource.attributes.event.payload,
  status: resource.attributes.status,
  responseCode: resource.attributes.response_code,
  responseBody: resource.attributes.response_body,
  responseHeaders: resource.attributes.response_headers,
  attemptAt: resource.attributes.attempt_timestamp,
})

// No `eventType` here — the list endpoint doesn't return it. See the comment on
// `WebhookDelivery.eventType` in PlatformWebhooks.types.ts.
export const toWebhookDeliverySummary = (
  resource: WebhookDeliveryListItemResource,
  endpointId: string
): WebhookDelivery => ({
  id: resource.id,
  endpointId,
  eventId: resource.attributes.event_id,
  status: resource.attributes.status,
  responseCode: resource.attributes.response_code,
  responseBody: resource.attributes.response_body,
  responseHeaders: resource.attributes.response_headers,
  attemptAt: resource.attributes.attempt_timestamp,
})
