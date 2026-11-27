import { AlertCircleIcon } from 'lucide-react'
import { Alert, AlertTitle } from 'ui'
import { PageSection } from 'ui-patterns/PageSection'

import { PostgrestConfig } from './PostgrestConfig'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'

export const ServiceList = () => {
  const { data: project, isPending: isLoading } = useSelectedProjectQuery()

  return (
    <PageSection id="api-settings" className="pt-0 last:pb-0">
      {!isLoading && project?.status !== PROJECT_STATUS.ACTIVE_HEALTHY ? (
        <Alert variant="destructive">
          <AlertCircleIcon size={16} />
          <AlertTitle>API settings are unavailable as the project is not active</AlertTitle>
        </Alert>
      ) : (
        <PostgrestConfig />
      )}
    </PageSection>
  )
}
