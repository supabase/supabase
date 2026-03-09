import { queryOptions } from '@tanstack/react-query'
import { handleError } from 'data/fetchers'

import { marketplaceIntegrationsKeys } from './keys'
import { createMarketplaceClient } from './marketplace-client'

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
