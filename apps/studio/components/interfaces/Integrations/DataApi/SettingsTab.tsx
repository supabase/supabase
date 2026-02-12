import { useParams } from 'common'
import { PageContainer } from 'ui-patterns'

import { DataApiDisabledState } from '@/components/interfaces/Integrations/DataApi/DataApiDisabledState'
import { ServiceList } from '@/components/interfaces/Settings/API/ServiceList'
import { useIsDataApiEnabled } from '@/hooks/misc/useIsDataApiEnabled'

export const DataApiSettingsTab = () => {
  const { ref: projectRef } = useParams()
  const { isEnabled, isPending } = useIsDataApiEnabled({ projectRef })

  if (!isPending && !isEnabled) {
    return <DataApiDisabledState description="configure settings" />
  }

  return (
    <PageContainer size="default" className="ml-0">
      <ServiceList />
    </PageContainer>
  )
}
