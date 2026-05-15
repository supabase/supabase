import { AlertCircle } from 'lucide-react'
import { Alert, AlertTitle } from 'ui'

import { PostgrestConfig } from './PostgrestConfig'
import { ScaffoldSection } from '@/components/layouts/Scaffold'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'

export const ServiceList = () => {
  const { data: project, isPending: isLoading } = useSelectedProjectQuery()

  return (
    <ScaffoldSection isFullWidth id="api-settings" className="gap-6">
      {!isLoading && project?.status !== PROJECT_STATUS.ACTIVE_HEALTHY ? (
        <Alert variant="destructive">
          <AlertCircle size={16} />
          <AlertTitle>API settings are unavailable as the project is not active</AlertTitle>
        </Alert>
      ) : (
        <PostgrestConfig />
      )}
    </ScaffoldSection>
  )
}
