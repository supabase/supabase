import { useFlag } from 'common'

import { IntegrationDefinition } from './Integrations.constants'
import { useMarketplaceIntegrationsQuery } from '@/data/marketplace/integrations-query'

export const useAvailableIntegrations = () => {
  const isMarketplaceEnabled = useFlag('marketplaceIntegrations')

  const { data, error } = useMarketplaceIntegrationsQuery({ enabled: isMarketplaceEnabled })
  const isPending = !data && !error

  // [Joshen] Format marketplace integrations into existing ones for now
  // Likely that we might need to change, but can look into separately

  const formattedIntegrations: IntegrationDefinition[] = data?.map((integration) => {
    const { id, title: name, summary: description, documentation_url: docsUrl } = integration

    const status = undefined
    const icon = undefined

    return {
      id,
      name,
      status,
      description,
      docsUrl,
    }
  })

  return { data, error, isPending, isError: !!error, isSuccess: !!data }
}
