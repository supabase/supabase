import type { operations } from 'api-types'

import { del, get, handleError, patch, post } from '@/data/fetchers'

export type WebhookScopeParams =
  | { scope: 'organization'; orgSlug: string }
  | { scope: 'project'; projectRef: string }

export type WebhookEventType =
  operations['v2-organizations-slug-webhooks-endpoints-post']['requestBody']['content']['application/json']['data']['attributes']['event_types'][number]['type']

export interface WebhookEndpointAttributesInput {
  url: string
  description?: string | null
  enabled?: boolean
  event_types: { type: WebhookEventType }[]
  custom_headers?: Record<string, string> | null
  signing_secret?: string
}

interface ListPageParams {
  limit?: number
  offset?: number
}

// Every function below is the single place that branches on organization vs project —
// hooks never need to know which URL family they're calling.

export async function listWebhookEndpoints(
  scope: WebhookScopeParams,
  page?: ListPageParams,
  signal?: AbortSignal
) {
  const query = {
    'page[limit]': page?.limit?.toString(),
    'page[offset]': page?.offset?.toString(),
  }

  const { data, error } =
    scope.scope === 'organization'
      ? await get('/v2/organizations/{slug}/webhooks/endpoints', {
          params: { path: { slug: scope.orgSlug }, query },
          signal,
        })
      : await get('/v2/projects/{ref}/webhooks/endpoints', {
          params: { path: { ref: scope.projectRef }, query },
          signal,
        })

  if (error) handleError(error)
  return data
}

export async function getWebhookEndpoint(
  scope: WebhookScopeParams,
  id: string,
  signal?: AbortSignal
) {
  const { data, error } =
    scope.scope === 'organization'
      ? await get('/v2/organizations/{slug}/webhooks/endpoints/{id}', {
          params: { path: { slug: scope.orgSlug, id } },
          signal,
        })
      : await get('/v2/projects/{ref}/webhooks/endpoints/{id}', {
          params: { path: { ref: scope.projectRef, id } },
          signal,
        })

  if (error) handleError(error)
  return data
}

export async function createWebhookEndpoint(
  scope: WebhookScopeParams,
  attributes: WebhookEndpointAttributesInput & { signing_secret: string }
) {
  const body = { data: { type: 'endpoint' as const, attributes } }

  const { data, error } =
    scope.scope === 'organization'
      ? await post('/v2/organizations/{slug}/webhooks/endpoints', {
          params: { path: { slug: scope.orgSlug } },
          body,
        })
      : await post('/v2/projects/{ref}/webhooks/endpoints', {
          params: { path: { ref: scope.projectRef } },
          body,
        })

  if (error) handleError(error)
  return data
}

export async function updateWebhookEndpoint(
  scope: WebhookScopeParams,
  id: string,
  attributes: WebhookEndpointAttributesInput
) {
  const body = { data: { type: 'endpoint' as const, attributes } }

  const { data, error } =
    scope.scope === 'organization'
      ? await patch('/v2/organizations/{slug}/webhooks/endpoints/{id}', {
          params: { path: { slug: scope.orgSlug, id } },
          body,
        })
      : await patch('/v2/projects/{ref}/webhooks/endpoints/{id}', {
          params: { path: { ref: scope.projectRef, id } },
          body,
        })

  if (error) handleError(error)
  return data
}

export async function regenerateWebhookEndpointSecret(
  scope: WebhookScopeParams,
  id: string,
  signingSecret: string
) {
  // The server never echoes `signing_secret` back — the caller already knows the
  // value since it's client-chosen, so there's nothing to read from the response here.
  const body = {
    data: { type: 'endpoint' as const, attributes: { signing_secret: signingSecret } },
  }

  const { data, error } =
    scope.scope === 'organization'
      ? await patch('/v2/organizations/{slug}/webhooks/endpoints/{id}', {
          params: { path: { slug: scope.orgSlug, id } },
          body,
        })
      : await patch('/v2/projects/{ref}/webhooks/endpoints/{id}', {
          params: { path: { ref: scope.projectRef, id } },
          body,
        })

  if (error) handleError(error)
  return data
}

export async function deleteWebhookEndpoint(scope: WebhookScopeParams, id: string) {
  const { data, error } =
    scope.scope === 'organization'
      ? await del('/v2/organizations/{slug}/webhooks/endpoints/{id}', {
          params: { path: { slug: scope.orgSlug, id } },
        })
      : await del('/v2/projects/{ref}/webhooks/endpoints/{id}', {
          params: { path: { ref: scope.projectRef, id } },
        })

  if (error) handleError(error)
  return data
}

export async function listWebhookDeliveries(
  scope: WebhookScopeParams,
  endpointId: string,
  page?: { size?: number; after?: string; before?: string },
  signal?: AbortSignal
) {
  const query = {
    'page[size]': page?.size?.toString(),
    'page[after]': page?.after,
    'page[before]': page?.before,
  }

  const { data, error } =
    scope.scope === 'organization'
      ? await get('/v2/organizations/{slug}/webhooks/endpoints/{id}/deliveries', {
          params: { path: { slug: scope.orgSlug, id: endpointId }, query },
          signal,
        })
      : await get('/v2/projects/{ref}/webhooks/endpoints/{id}/deliveries', {
          params: { path: { ref: scope.projectRef, id: endpointId }, query },
          signal,
        })

  if (error) handleError(error)
  return data
}

export async function getWebhookDelivery(
  scope: WebhookScopeParams,
  id: string,
  signal?: AbortSignal
) {
  const { data, error } =
    scope.scope === 'organization'
      ? await get('/v2/organizations/{slug}/webhooks/deliveries/{id}', {
          params: { path: { slug: scope.orgSlug, id } },
          signal,
        })
      : await get('/v2/projects/{ref}/webhooks/deliveries/{id}', {
          params: { path: { ref: scope.projectRef, id } },
          signal,
        })

  if (error) handleError(error)
  return data
}

export async function sendTestWebhookEvent(scope: WebhookScopeParams, id: string) {
  // No event type specified — the backend picks one the endpoint is already
  // subscribed to. See PlatformWebhooksPage.tsx for the simpler v1 scope decision.
  const { data, error } =
    scope.scope === 'organization'
      ? await post('/v2/organizations/{slug}/webhooks/endpoints/{id}/test', {
          params: { path: { slug: scope.orgSlug, id } },
          body: {},
        })
      : await post('/v2/projects/{ref}/webhooks/endpoints/{id}/test', {
          params: { path: { ref: scope.projectRef, id } },
          body: {},
        })

  if (error) handleError(error)
  return data
}

export async function retryWebhookDelivery(scope: WebhookScopeParams, id: string) {
  const { data, error } =
    scope.scope === 'organization'
      ? await post('/v2/organizations/{slug}/webhooks/deliveries/{id}/retry', {
          params: { path: { slug: scope.orgSlug, id } },
        })
      : await post('/v2/projects/{ref}/webhooks/deliveries/{id}/retry', {
          params: { path: { ref: scope.projectRef, id } },
        })

  if (error) handleError(error)
  return data
}
