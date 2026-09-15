import { useQuery } from '@tanstack/react-query'
import { createMarketplaceClient, type Category } from 'common/marketplace-client'

import { marketplaceIntegrationsKeys } from './keys'
import { handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type MarketplaceCategory = Category

export async function getMarketplaceCategories(signal?: AbortSignal) {
  const marketplaceClient = createMarketplaceClient()
  let query = marketplaceClient.from('categories').select('*')
  if (signal) query = query.abortSignal(signal)
  const { data, error } = await query

  if (error) handleError(error)
  return data ?? []
}

export type MarketplaceCategoriesData = Awaited<ReturnType<typeof getMarketplaceCategories>>
export type MarketplaceCategoriesError = ResponseError

export const useMarketplaceCategoriesQuery = <TData = MarketplaceCategoriesData>({
  enabled = true,
  ...options
}: UseCustomQueryOptions<MarketplaceCategoriesData, MarketplaceCategoriesError, TData> = {}) =>
  useQuery<MarketplaceCategoriesData, MarketplaceCategoriesError, TData>({
    queryKey: marketplaceIntegrationsKeys.categories(),
    queryFn: ({ signal }) => getMarketplaceCategories(signal),
    enabled,
    ...options,
  })
