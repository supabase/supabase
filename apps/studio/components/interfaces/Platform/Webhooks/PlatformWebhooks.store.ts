import { useState } from 'react'

import { PLATFORM_WEBHOOKS_MOCK_DATA } from './PlatformWebhooks.mock'
import type {
  PlatformWebhooksState,
  UpsertWebhookEndpointInput,
  WebhookDelivery,
  WebhookEndpoint,
  WebhookScope,
} from './PlatformWebhooks.types'

interface CreateEndpointOptions {
  now?: string
  endpointId?: string
  createdBy?: string
  signingSecret?: string
}

interface UpdateEndpointOptions {
  headerIdFactory?: () => string
}

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

const randomId = (prefix: string) => `${prefix}-${secureRandomHex(8)}`

const generateSigningSecret = () => `whsec_${secureRandomHex(16)}`

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

const toHeaders = (
  headers: UpsertWebhookEndpointInput['customHeaders'],
  options?: UpdateEndpointOptions
) => {
  const headerIdFactory = options?.headerIdFactory ?? (() => randomId('header'))
  return headers
    .map((header) => ({
      id: headerIdFactory(),
      key: header.key.trim(),
      value: header.value.trim(),
    }))
    .filter((header) => header.key.length > 0 && header.value.length > 0)
}

const normalizeSearch = (value: string) => value.trim().toLowerCase()

export const createInitialPlatformWebhooksState = (scope: WebhookScope): PlatformWebhooksState => {
  const seed = PLATFORM_WEBHOOKS_MOCK_DATA[scope]
  return {
    endpoints: deepClone(seed.endpoints),
    deliveries: deepClone(seed.deliveries),
  }
}

export const createWebhookEndpoint = (
  state: PlatformWebhooksState,
  input: UpsertWebhookEndpointInput,
  options?: CreateEndpointOptions
): { state: PlatformWebhooksState; endpoint: WebhookEndpoint; signingSecret: string } => {
  const endpointId = options?.endpointId ?? randomId('endpoint')
  const internalName = input.name.trim().length > 0 ? input.name.trim() : endpointId
  const signingSecret = options?.signingSecret ?? generateSigningSecret()
  const endpoint: WebhookEndpoint = {
    id: endpointId,
    name: internalName,
    url: input.url.trim(),
    description: input.description.trim(),
    enabled: input.enabled,
    eventTypes: input.eventTypes.length > 0 ? input.eventTypes : ['*'],
    customHeaders: toHeaders(input.customHeaders),
    createdBy: options?.createdBy ?? 'mock-user@supabase.io',
    createdAt: options?.now ?? new Date().toISOString(),
  }

  return {
    endpoint,
    signingSecret,
    state: {
      ...state,
      endpoints: [endpoint, ...state.endpoints],
    },
  }
}

export const updateWebhookEndpoint = (
  state: PlatformWebhooksState,
  endpointId: string,
  input: UpsertWebhookEndpointInput,
  options?: UpdateEndpointOptions
) => {
  return {
    ...state,
    endpoints: state.endpoints.map((endpoint) =>
      endpoint.id === endpointId
        ? {
            ...endpoint,
            name: input.name.trim().length > 0 ? input.name.trim() : endpoint.name,
            url: input.url.trim(),
            description: input.description.trim(),
            enabled: input.enabled,
            eventTypes: input.eventTypes.length > 0 ? input.eventTypes : ['*'],
            customHeaders: toHeaders(input.customHeaders, options),
          }
        : endpoint
    ),
  }
}

export const deleteWebhookEndpoint = (state: PlatformWebhooksState, endpointId: string) => {
  return {
    endpoints: state.endpoints.filter((endpoint) => endpoint.id !== endpointId),
    deliveries: state.deliveries.filter((delivery) => delivery.endpointId !== endpointId),
  }
}

export const toggleWebhookEndpoint = (
  state: PlatformWebhooksState,
  endpointId: string,
  enabled?: boolean
) => {
  return {
    ...state,
    endpoints: state.endpoints.map((endpoint) =>
      endpoint.id === endpointId
        ? { ...endpoint, enabled: enabled === undefined ? !endpoint.enabled : enabled }
        : endpoint
    ),
  }
}

export const regenerateWebhookEndpointSecret = (
  state: PlatformWebhooksState,
  endpointId: string,
  secret?: string
) => {
  const endpointExists = state.endpoints.some((endpoint) => endpoint.id === endpointId)
  if (!endpointExists) return { state, signingSecret: null }

  return {
    state: { ...state },
    signingSecret: secret ?? generateSigningSecret(),
  }
}

export const filterWebhookEndpoints = (endpoints: WebhookEndpoint[], search: string) => {
  const normalizedSearch = normalizeSearch(search)
  if (normalizedSearch.length === 0) return endpoints

  return endpoints.filter((endpoint) => {
    const haystack = `${endpoint.name} ${endpoint.url} ${endpoint.description}`.toLowerCase()
    return haystack.includes(normalizedSearch)
  })
}

export const filterWebhookDeliveries = (
  deliveries: WebhookDelivery[],
  endpointId: string,
  search: string
) => {
  const normalizedSearch = normalizeSearch(search)

  return deliveries
    .filter((delivery) => delivery.endpointId === endpointId)
    .filter((delivery) => {
      if (normalizedSearch.length === 0) return true
      const haystack =
        `${delivery.eventType} ${delivery.status} ${delivery.responseCode ?? ''}`.toLowerCase()
      return haystack.includes(normalizedSearch)
    })
}

export const usePlatformWebhooksMockStore = (scope: WebhookScope) => {
  const [state, setState] = useState<PlatformWebhooksState>(() =>
    createInitialPlatformWebhooksState(scope)
  )

  return {
    ...state,
    createEndpoint: (input: UpsertWebhookEndpointInput) => {
      const endpointId = randomId('endpoint')
      const now = new Date().toISOString()
      const signingSecret = generateSigningSecret()
      const createdBy = 'mock-user@supabase.io'
      let createdSecret = signingSecret
      setState(
        (prev) => {
          const next = createWebhookEndpoint(prev, input, {
            endpointId,
            now,
            signingSecret,
            createdBy,
          })
          createdSecret = next.signingSecret
          return next.state
        }
      )
      return { endpointId, signingSecret: createdSecret }
    },
    updateEndpoint: (endpointId: string, input: UpsertWebhookEndpointInput) => {
      setState((prev) => updateWebhookEndpoint(prev, endpointId, input))
    },
    deleteEndpoint: (endpointId: string) => {
      setState((prev) => deleteWebhookEndpoint(prev, endpointId))
    },
    toggleEndpoint: (endpointId: string, enabled?: boolean) => {
      setState((prev) => toggleWebhookEndpoint(prev, endpointId, enabled))
    },
    regenerateSecret: (endpointId: string) => {
      let nextSecret: string | null = null
      setState((prev) => {
        const next = regenerateWebhookEndpointSecret(prev, endpointId)
        nextSecret = next.signingSecret
        return next.state
      })
      return nextSecret
    },
  }
}
