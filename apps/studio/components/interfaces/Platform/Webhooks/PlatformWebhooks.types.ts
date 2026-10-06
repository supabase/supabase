export type WebhookScope = 'organization' | 'project'

export type WebhookDeliveryStatus = 'pending' | 'success' | 'failure' | 'skipped'

// UI-only row shape for the headers form (add/edit by key+value). The real API
// stores these as a plain `{ [key]: value }` object — converted in the data layer.
export interface WebhookHeader {
  id: string
  key: string
  value: string
}

export interface WebhookEndpoint {
  id: string
  // No `name` field in the real API — client-only until backend adds one.
  name: string
  url: string
  description: string
  enabled: boolean
  eventTypes: string[]
  customHeaders: WebhookHeader[]
  createdBy: string
  createdAt: string
}

export interface WebhookDelivery {
  id: string
  endpointId: string
  eventId: string
  // Only present when fetched via the single-delivery endpoint (drill-down view) —
  // the deliveries *list* endpoint doesn't return either, so list rows leave these unset.
  eventType?: string
  eventPayload?: Record<string, unknown>
  status: WebhookDeliveryStatus
  // Always present in the real API (`0` if unavailable), unlike the old mock.
  responseCode: number
  responseBody: string | Record<string, string> | null
  responseHeaders: Record<string, string> | null
  attemptAt: string
}

export interface PlatformWebhooksMockSeed {
  eventTypes: string[]
  endpoints: WebhookEndpoint[]
  deliveries: WebhookDelivery[]
}

export interface PlatformWebhooksState {
  endpoints: WebhookEndpoint[]
  deliveries: WebhookDelivery[]
}

export interface UpsertWebhookEndpointInput {
  name: string
  url: string
  description: string
  enabled: boolean
  eventTypes: string[]
  customHeaders: Array<Pick<WebhookHeader, 'key' | 'value'>>
  // Required by the real API on create — the user chooses the secret, it's not server-generated.
  signingSecret: string
}
