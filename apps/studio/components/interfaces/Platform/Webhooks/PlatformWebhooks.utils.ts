import type { WebhookDelivery, WebhookEndpoint } from './PlatformWebhooks.types'

const secureRandomHex = (length: number) => {
  if (length <= 0) return ''

  const cryptoApi = globalThis.crypto
  if (!cryptoApi?.getRandomValues) {
    throw new Error('Web Crypto API is not available')
  }

  const byteCount = Math.ceil(length / 2)
  const bytes = new Uint8Array(byteCount)
  cryptoApi.getRandomValues(bytes)

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length)
}

export const generateSigningSecret = () => `whsec_${secureRandomHex(16)}`

export const getWebhookEndpointDisplayName = (
  endpoint: Pick<WebhookEndpoint, 'url' | 'eventTypes'>
) => {
  const eventTypesLabel = endpoint.eventTypes.includes('*')
    ? 'all events'
    : endpoint.eventTypes.join(', ')
  return `${endpoint.url} (${eventTypesLabel})`
}

export const getTestWebhookEventType = (
  subscribedEventTypes: string[],
  fallbackEventTypes: string[]
) => subscribedEventTypes.find((eventType) => eventType !== '*') ?? fallbackEventTypes[0]

export const isTestDelivery = (delivery: Pick<WebhookDelivery, 'eventPayload'>) =>
  delivery.eventPayload.is_test === true

const normalizeSearch = (value: string) => value.trim().toLowerCase()

export const filterWebhookEndpoints = (endpoints: WebhookEndpoint[], search: string) => {
  const normalizedSearch = normalizeSearch(search)
  if (normalizedSearch.length === 0) return endpoints

  return endpoints.filter((endpoint) => {
    const haystack =
      `${getWebhookEndpointDisplayName(endpoint)} ${endpoint.url} ${endpoint.description}`.toLowerCase()
    return haystack.includes(normalizedSearch)
  })
}
