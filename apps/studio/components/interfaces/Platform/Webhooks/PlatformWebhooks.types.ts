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
  eventType: string
  eventPayload: Record<string, unknown>
  status: WebhookDeliveryStatus
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
  url: string
  description: string
  enabled: boolean
  eventTypes: string[]
  customHeaders: Array<Pick<WebhookHeader, 'key' | 'value'>>
  signingSecret: string
}
