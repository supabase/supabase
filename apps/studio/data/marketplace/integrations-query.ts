import { queryOptions } from '@tanstack/react-query'
import { createMarketplaceClient } from 'common/marketplace-client'

import { marketplaceIntegrationsKeys } from './keys'
import { handleError } from '@/data/fetchers'

async function getMarketplaceIntegrations() {
  const marketplaceClient = createMarketplaceClient()
  const { data, error } = await marketplaceClient
    .from('listings')
    .select('*')
    .is('publish_dashboard', true)

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
