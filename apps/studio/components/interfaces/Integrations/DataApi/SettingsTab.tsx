import { useParams } from 'common'
import { PageSection } from 'ui-patterns'

import { ConstrainedIntegrationTabScaffold } from '../ConstrainedIntegrationTabScaffold'
import { DataApiURLSettings } from './DataApiURLSettings'
import { useIsMarketplaceEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { DataApiDisabledState } from '@/components/interfaces/Integrations/DataApi/DataApiDisabledState'
import { ServiceList } from '@/components/interfaces/Settings/API/ServiceList'
import { useIsDataApiEnabled } from '@/hooks/misc/useIsDataApiEnabled'
import { IS_PLATFORM } from '@/lib/constants'

export const DataApiSettingsTab = () => {
  const { ref: projectRef } = useParams()
  const { isEnabled, isPending } = useIsDataApiEnabled({ projectRef })
  const isMarketplaceEnabled = useIsMarketplaceEnabled()

  if (IS_PLATFORM && !isPending && !isEnabled) {
    return (
      <ConstrainedIntegrationTabScaffold>
        <DataApiDisabledState description="configure settings" />
      </ConstrainedIntegrationTabScaffold>
    )
  }

  return (
    <ConstrainedIntegrationTabScaffold>
      {isMarketplaceEnabled && <DataApiURLSettings />}
      <PageSection className={!isMarketplaceEnabled ? 'pt-0!' : ''}>
        <ServiceList />
      </PageSection>
    </ConstrainedIntegrationTabScaffold>
  )
}
