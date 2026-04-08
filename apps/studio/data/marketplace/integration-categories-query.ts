import { queryOptions } from '@tanstack/react-query'

import { marketplaceIntegrationsKeys } from './keys'
import { createMarketplaceClient } from './marketplace-client'
import { handleError } from '@/data/fetchers'

async function getMarketplaceCategories() {
  const client = createMarketplaceClient()
  const { data, error } = await client.from('categories').select('*')

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
