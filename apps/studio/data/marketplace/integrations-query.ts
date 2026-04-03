import { queryOptions } from '@tanstack/react-query'

import { marketplaceIntegrationsKeys } from './keys'
import { createMarketplaceClient } from './marketplace-client'
import { handleError } from '@/data/fetchers'

async function getMarketplaceIntegrations() {
  const client = createMarketplaceClient()
  const { data, error } = await client
    .from('items')
    .select('*, categories:category_items(...categories(slug, title))')

  if (error) handleError(error)
  return data ?? []
}

export const marketplaceIntegrationsQueryOptions = ({
  enabled = true,
}: { enabled?: boolean } = {}) => {
  return queryOptions({
    queryKey: marketplaceIntegrationsKeys.list(),
    queryFn: () => getMarketplaceIntegrations(),
    enabled,
  })
}
