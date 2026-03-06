import { useFlag } from 'common'

import { useMarketplaceIntegrationsQuery } from '@/data/marketplace/integrations-query'

export const useAvailableIntegrations = () => {
  const isMarketplaceEnabled = useFlag('marketplaceIntegrations')

  const { data, error } = useMarketplaceIntegrationsQuery({ enabled: isMarketplaceEnabled })
  const isPending = !data && !error

  return { data, error, isPending, isError: !!error, isSuccess: !!data }
}
