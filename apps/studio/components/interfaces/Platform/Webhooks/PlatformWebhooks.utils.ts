import type { WebhookDelivery, WebhookEndpoint } from './PlatformWebhooks.types'

const WEBHOOK_NAME_ADJECTIVES = [
  'swift',
  'winged',
  'wayfinding',
  'moonlit',
  'fleet',
  'nimble',
  'roving',
  'brisk',
  'gliding',
  'steady',
  'northbound',
  'starlit',
  'quiet',
  'amber',
  'far-flung',
  'secret',
  'flying',
]

const WEBHOOK_NAME_NOUNS = [
  'pigeon',
  'courier',
  'postmark',
  'relay',
  'dispatch',
  'lantern',
  'beacon',
  'messenger',
  'waypost',
  'sparrow',
  'satchel',
  'signalfire',
  'envelope',
  'parcel',
  'gull',
  'kite',
  'beagle',
]

const getRandomItem = (values: string[]) => values[Math.floor(Math.random() * values.length)]

export const generateWebhookEndpointName = () =>
  `${getRandomItem(WEBHOOK_NAME_ADJECTIVES)}-${getRandomItem(WEBHOOK_NAME_NOUNS)}`

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

export const getWebhookEndpointDisplayName = (endpoint: Pick<WebhookEndpoint, 'name' | 'url'>) =>
  endpoint.name.trim() || endpoint.url

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

export const filterWebhookDeliveries = (deliveries: WebhookDelivery[], search: string) => {
  const normalizedSearch = normalizeSearch(search)

  return deliveries
    .filter((delivery) => {
      if (normalizedSearch.length === 0) return true
      const haystack =
        `${delivery.eventType ?? ''} ${delivery.status} ${delivery.responseCode ?? ''}`.toLowerCase()
      return haystack.includes(normalizedSearch)
    })
    .sort((a, b) => new Date(b.attemptAt).getTime() - new Date(a.attemptAt).getTime())
}
