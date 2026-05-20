import { useParams } from 'common'
import { PropsWithChildren } from 'react'

import { useAvailableIntegrations } from '../Landing/useAvailableIntegrations'
import { IntegrationOverviewTab } from './IntegrationOverviewTab'
import { useIsMarketplaceEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'

/**
 * Wrapper for marketplace DB integrations (Grafana, etc.)
 * Returns null for marketplace mode (content is handled by Marketplace/OverviewTab)
 * Returns IntegrationOverviewTabV2 for legacy mode
 */
export const MarketplaceIntegrationOverviewTab = (props: PropsWithChildren) => {
  const { id } = useParams()
  const isMarketplaceEnabled = useIsMarketplaceEnabled()

  const { data: allIntegrations } = useAvailableIntegrations()
  const integration = allIntegrations.find((i) => i.id === id)

  if (!integration) {
    return <div>Integration not found</div>
  }

  // For marketplace mode, return null since Marketplace/OverviewTab handles the layout
  if (isMarketplaceEnabled) {
    return null
  }

  // For legacy mode, return the full overview tab
  return <IntegrationOverviewTab>{props.children}</IntegrationOverviewTab>
}
