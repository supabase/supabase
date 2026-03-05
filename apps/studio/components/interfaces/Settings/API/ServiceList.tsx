import { AlertCircle } from 'lucide-react'
import { Alert_Shadcn_, AlertTitle_Shadcn_ } from 'ui'

import { PostgrestConfig } from './PostgrestConfig'
import { ScaffoldSection } from '@/components/layouts/Scaffold'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'

export const ServiceList = () => {
  const { data: project, isPending: isLoading } = useSelectedProjectQuery()

  return (
    <ScaffoldSection isFullWidth id="api-settings" className="gap-6">
      {!isLoading && project?.status !== PROJECT_STATUS.ACTIVE_HEALTHY ? (
        <Alert_Shadcn_ variant="destructive">
          <AlertCircle size={16} />
          <AlertTitle_Shadcn_>
            API settings are unavailable as the project is not active
          </AlertTitle_Shadcn_>
        </Alert_Shadcn_>
      ) : (
        <PostgrestConfig />
      )}
    </ScaffoldSection>
  )
}
