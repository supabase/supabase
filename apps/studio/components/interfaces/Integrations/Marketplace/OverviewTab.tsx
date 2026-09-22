import dynamic from 'next/dynamic'
import type { PropsWithChildren } from 'react'

import { MarketplaceDetailRail } from './MarketplaceDetailRail'
import { ConstrainedIntegrationTabScaffold } from '@/components/interfaces/Integrations/ConstrainedIntegrationTabScaffold'
import { MarkdownContent } from '@/components/interfaces/Integrations/Integration/IntegrationOverviewTabV2/MarkdownContent'
import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'

const FilesViewer = dynamic(() =>
  import('@/components/interfaces/Integrations/Integration/IntegrationOverviewTabV2/FilesViewer').then(
    (mod) => mod.FilesViewer
  )
)

interface OverviewTabProps extends PropsWithChildren {
  integration: IntegrationDefinition
  isInstalled: boolean
}

export const OverviewTab = ({ integration, isInstalled, children }: OverviewTabProps) => {
  const { content, files = [] } = integration

  return (
    <ConstrainedIntegrationTabScaffold>
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-10 @4xl:grid-cols-[minmax(0,760px)_240px]">
        <div className="min-w-0 flex flex-col gap-8">
          {files.length > 0 && <FilesViewer files={files} />}
          <MarkdownContent integrationId={integration.id} content={content} />
          {children}
        </div>
        <MarketplaceDetailRail integration={integration} isInstalled={isInstalled} />
      </div>
    </ConstrainedIntegrationTabScaffold>
  )
}
