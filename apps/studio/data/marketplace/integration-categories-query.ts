import { queryOptions } from '@tanstack/react-query'
import { createMarketplaceClient } from 'common/marketplace-client'

import { marketplaceIntegrationsKeys } from './keys'
import { handleError } from '@/data/fetchers'

async function getMarketplaceCategories() {
  const marketplaceClient = createMarketplaceClient()
  const { data, error } = await marketplaceClient.from('categories').select('*')

  if (error) handleError(error)
  return data ?? []
}

export const marketplaceCategoriesQueryOptions = ({
  enabled = true,
}: { enabled?: boolean } = {}) => {
  return queryOptions({
    queryKey: marketplaceIntegrationsKeys.categories(),
    queryFn: () => getMarketplaceCategories(),
    enabled,
  })
}
