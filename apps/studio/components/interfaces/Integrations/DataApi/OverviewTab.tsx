import { useParams } from 'common'
import { AlertCircle } from 'lucide-react'
import { Alert_Shadcn_, AlertTitle_Shadcn_, cn } from 'ui'

import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'
import { DataApiEnableSwitch } from '@/components/interfaces/Settings/API/DataApiEnableSwitch'
import { DataApiProjectUrlCard } from '@/components/interfaces/Settings/API/DataApiProjectUrlCard'
import { useIsDataApiEnabled } from '@/hooks/misc/useIsDataApiEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'

export const DataApiOverviewTab = () => {
  const { ref: projectRef } = useParams()
  const { data: project, isPending: isProjectLoading } = useSelectedProjectQuery()
  const { isEnabled, isPending: isConfigLoading } = useIsDataApiEnabled({ projectRef })

  const isLoading = isProjectLoading || isConfigLoading

  return (
    <IntegrationOverviewTab>
      <div className="px-10 max-w-4xl flex flex-col">
        {!isProjectLoading && project?.status !== PROJECT_STATUS.ACTIVE_HEALTHY ? (
          <Alert_Shadcn_ variant="destructive">
            <AlertCircle size={16} />
            <AlertTitle_Shadcn_>
              API settings are unavailable as the project is not active
            </AlertTitle_Shadcn_>
          </Alert_Shadcn_>
        ) : (
          <>
            <div className={cn((isLoading || !isEnabled) && 'opacity-50 pointer-events-none')}>
              <DataApiProjectUrlCard />
            </div>
            <DataApiEnableSwitch />
          </>
        )}
      </div>
    </IntegrationOverviewTab>
  )
}
