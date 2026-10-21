import { useQuery } from '@tanstack/react-query'

import { platformWebhooksKeys } from './keys'
import { listWebhookDeliveries, type WebhookScopeParams } from './platform-webhooks-fetchers'
import { toWebhookDelivery } from './platform-webhooks-mappers'
import type { WebhookDelivery } from '@/components/interfaces/Platform/Webhooks/PlatformWebhooks.types'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

interface WebhookDeliveriesVariables {
  scope: WebhookScopeParams
  endpointId: string
  size?: number
  after?: string
  before?: string
}

const extractCursor = (link: string | null | undefined, param: 'page[after]' | 'page[before]') => {
  if (!link) return null
  return new URL(link, 'http://localhost').searchParams.get(param)
}

const DEFAULT_PAGE_SIZE = 5

export interface WebhookDeliveriesData {
  deliveries: WebhookDelivery[]
  nextCursor: string | null
  previousCursor: string | null
}

async function getWebhookDeliveries(
  { scope, endpointId, size, after, before }: WebhookDeliveriesVariables,
  signal?: AbortSignal
): Promise<WebhookDeliveriesData> {
  const pageSize = size ?? DEFAULT_PAGE_SIZE
  // The server's `links.next` can be present even when nothing actually follows (it
  // reflects "this page was full", not "more data exists"). Ask for one extra record
  // to find out for certain: getting it back means there's really a next page.
  const result = await listWebhookDeliveries(
    scope,
    endpointId,
    { size: pageSize + 1, after, before },
    signal
  )
  const resources = result?.data ?? []
  const hasExtraRecord = resources.length > pageSize
  const deliveries = resources
    .slice(0, pageSize)
    .map((delivery) => toWebhookDelivery(delivery, endpointId))

  // The server's `links.next` points after the lookahead record itself (the one we
  // fetched but didn't display), which would skip it entirely on the next page. Use the
  // last *displayed* record's id instead, so the lookahead record becomes page 2's first
  // row rather than disappearing. When paging backward (`before` set) and this page
  // doesn't overflow past `pageSize`, there's no extra record to anchor to — but a next
  // page still exists: it's exactly the page we navigated back from, starting at `before`.
  const nextCursor = hasExtraRecord ? (resources[pageSize - 1]?.id ?? null) : (before ?? null)

  return {
    deliveries,
    nextCursor,
    previousCursor: extractCursor(result?.links.prev, 'page[before]'),
  }
}

export const useWebhookDeliveriesQuery = <TData = WebhookDeliveriesData>(
  variables: WebhookDeliveriesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<WebhookDeliveriesData, ResponseError, TData> = {}
) => {
  const { scope, endpointId, size, after, before } = variables

  return useQuery<WebhookDeliveriesData, ResponseError, TData>({
    queryKey: platformWebhooksKeys.deliveries(scope, endpointId, size, after, before),
    queryFn: ({ signal }) =>
      getWebhookDeliveries({ scope, endpointId, size, after, before }, signal),
    enabled: enabled && Boolean(endpointId),
    refetchInterval: 5000,
    ...options,
  })
}
