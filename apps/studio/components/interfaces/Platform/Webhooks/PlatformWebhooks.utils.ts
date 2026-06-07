import type { WebhookEndpoint } from './PlatformWebhooks.types'

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

export const getWebhookEndpointDisplayName = (endpoint: Pick<WebhookEndpoint, 'name' | 'url'>) =>
  endpoint.name.trim() || endpoint.url
