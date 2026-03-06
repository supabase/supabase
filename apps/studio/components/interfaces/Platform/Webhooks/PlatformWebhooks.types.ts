export type WebhookScope = 'organization' | 'project'

export type WebhookDeliveryStatus = 'pending' | 'success' | 'failure' | 'skipped'

export interface WebhookHeader {
  id: string
  key: string
  value: string
}

export interface WebhookEndpoint {
  id: string
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
  eventType: string
  status: WebhookDeliveryStatus
  responseCode?: number
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
}
