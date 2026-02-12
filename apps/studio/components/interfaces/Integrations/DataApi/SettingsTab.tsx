import { useParams } from 'common'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_ } from 'ui'
import { PageContainer } from 'ui-patterns'

import { ServiceList } from '@/components/interfaces/Settings/API/ServiceList'
import { useIsDataApiEnabled } from '@/hooks/misc/useIsDataApiEnabled'

export const DataApiSettingsTab = () => {
  const { ref: projectRef } = useParams()
  const { isEnabled, isPending } = useIsDataApiEnabled({ projectRef })

  if (!isPending && !isEnabled) {
    return (
      <div className="flex w-full flex-1 items-center justify-center p-10">
        <Alert_Shadcn_ className="max-w-md">
          <AlertCircle size={16} />
          <AlertTitle_Shadcn_>Data API is disabled</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            Enable the Data API in the{' '}
            <Link
              href={`/project/${projectRef}/integrations/data_api/overview`}
              className="text-foreground underline hover:decoration-foreground-muted"
            >
              Overview
            </Link>{' '}
            tab to configure settings.
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      </div>
    )
  }

  return (
    <PageContainer size="default" className="ml-0">
      <ServiceList />
    </PageContainer>
  )
}
