import { useParams } from 'common'

import { ConstrainedIntegrationTabScaffold } from '../ConstrainedIntegrationTabScaffold'
import { DataApiDisabledState } from '@/components/interfaces/Integrations/DataApi/DataApiDisabledState'
import { ServiceList } from '@/components/interfaces/Settings/API/ServiceList'
import { useIsDataApiEnabled } from '@/hooks/misc/useIsDataApiEnabled'
import { IS_PLATFORM } from '@/lib/constants'

export const DataApiSettingsTab = () => {
  const { ref: projectRef } = useParams()
  const { isEnabled, isPending } = useIsDataApiEnabled({ projectRef })

  if (IS_PLATFORM && !isPending && !isEnabled) {
    return (
      <ConstrainedIntegrationTabScaffold className="p-0!">
        <DataApiDisabledState description="configure settings" />
      </ConstrainedIntegrationTabScaffold>
    )
  }

  return (
    <ConstrainedIntegrationTabScaffold>
      <ServiceList />
    </ConstrainedIntegrationTabScaffold>
  )
}
