/**
 * [Joshen] This is just to dynamically render either the V1 or V2 Overview tab based
 * on the marketplace feature flag
 */

import { useFlag } from 'common'
import { PropsWithChildren } from 'react'

import { IntegrationOverviewTab, IntegrationOverviewTabProps } from './IntegrationOverviewTab'
import { IntegrationOverviewTabV2 } from './IntegrationOverviewTabV2'

export const IntegrationOverviewTabWrapper = (
  props: PropsWithChildren<IntegrationOverviewTabProps>
) => {
  const isMarketplaceEnabled = useFlag('marketplaceIntegrations')

  if (isMarketplaceEnabled) {
    return <IntegrationOverviewTabV2>{props.children}</IntegrationOverviewTabV2>
  } else {
    return <IntegrationOverviewTab {...props} />
  }
}
