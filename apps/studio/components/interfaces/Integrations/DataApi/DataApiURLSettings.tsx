import { useParams } from 'common'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertTitle, cn } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { DataApiEnableSwitch } from '@/components/interfaces/Settings/API/DataApiEnableSwitch'
import { DataApiProjectUrlCard } from '@/components/interfaces/Settings/API/DataApiProjectUrlCard'
import { useIsDataApiEnabled } from '@/hooks/misc/useIsDataApiEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM, PROJECT_STATUS } from '@/lib/constants'

export const DataApiURLSettings = () => {
  const { ref: projectRef } = useParams()
  const { data: project, isPending: isProjectLoading } = useSelectedProjectQuery()
  const { isEnabled, isPending: isConfigLoading } = useIsDataApiEnabled({ projectRef })
  const isLoading = isProjectLoading || isConfigLoading

  return (
    <div className="flex flex-col">
      {!isProjectLoading && project?.status !== PROJECT_STATUS.ACTIVE_HEALTHY ? (
        <Alert variant="destructive">
          <AlertCircle size={16} />
          <AlertTitle>API settings are unavailable as the project is not active</AlertTitle>
        </Alert>
      ) : (
        <>
          <div
            className={cn(
              IS_PLATFORM && (isLoading || !isEnabled) && 'opacity-50 pointer-events-none'
            )}
          >
            <DataApiProjectUrlCard />
          </div>
          {IS_PLATFORM ? (
            <DataApiEnableSwitch />
          ) : (
            <Admonition
              type="default"
              title="Managed via configuration variables"
              description="Data API settings are configured via config.toml for CLI and local development, or via docker-compose.yml and .env for self-hosted deployments."
            />
          )}
        </>
      )}
    </div>
  )
}
