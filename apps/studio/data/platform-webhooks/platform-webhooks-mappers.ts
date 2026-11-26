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

const toWebhookEventTypes = (eventTypes: string[]): { type: WebhookEventType }[] =>
  eventTypes
    .map((eventType) => webhookEventTypeSchema.safeParse(eventType))
    .filter((result) => result.success)
    .map((result) => ({ type: result.data }))

const toCustomHeaders = (
  headers: Array<{ key: string; value: string }>
): Record<string, string> | undefined =>
  headers.length > 0
    ? Object.fromEntries(headers.map((header) => [header.key, header.value]))
    : undefined

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

type WebhookDeliveryResource =
  operations['v2-organizations-slug-webhooks-deliveries-id-get']['responses'][200]['content']['application/json']['data']

export const toWebhookEndpoint = (resource: WebhookEndpointResource): WebhookEndpoint => ({
  id: resource.id,
  url: resource.attributes.url,
  description: resource.attributes.description ?? '',
  enabled: resource.attributes.enabled,
  eventTypes: resource.attributes.event_types.map((eventType) => eventType.type),
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
  eventType: resource.attributes.event?.type ?? '',
  eventPayload: resource.attributes.event?.payload ?? {},
  status: resource.attributes.status,
  responseCode: resource.attributes.response_code,
  responseBody: resource.attributes.response_body,
  responseHeaders: resource.attributes.response_headers,
  attemptAt: resource.attributes.attempt_timestamp,
})
