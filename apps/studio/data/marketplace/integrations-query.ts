import { useQuery } from '@tanstack/react-query'
import { createMarketplaceClient, type MarketplaceListing } from 'common/marketplace-client'

import { marketplaceIntegrationsKeys } from './keys'
import { handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type MarketplaceIntegration = MarketplaceListing

export async function getMarketplaceIntegrations(signal?: AbortSignal) {
  const marketplaceClient = createMarketplaceClient()
  let query = marketplaceClient
    .from('marketplace_listings')
    .select('*')
    .not('published_in_marketplace_at', 'is', null)
  if (signal) query = query.abortSignal(signal)
  const { data, error } = await query

  if (error) handleError(error)
  return data ?? []
}

export type MarketplaceIntegrationsData = Awaited<ReturnType<typeof getMarketplaceIntegrations>>
export type MarketplaceIntegrationsError = ResponseError

export const useMarketplaceIntegrationsQuery = <TData = MarketplaceIntegrationsData>({
  enabled = true,
  ...options
}: UseCustomQueryOptions<MarketplaceIntegrationsData, MarketplaceIntegrationsError, TData> = {}) =>
  useQuery<MarketplaceIntegrationsData, MarketplaceIntegrationsError, TData>({
    queryKey: marketplaceIntegrationsKeys.list(),
    queryFn: ({ signal }) => getMarketplaceIntegrations(signal),
    enabled,
    ...options,
  })
