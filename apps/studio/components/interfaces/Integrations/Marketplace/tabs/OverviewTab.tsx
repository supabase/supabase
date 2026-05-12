import { MarketplaceDetailRail } from '../MarketplaceDetailRail'
import { FilesViewer } from '@/components/interfaces/Integrations/Integration/IntegrationOverviewTabV2/FilesViewer'
import { MarkdownContent } from '@/components/interfaces/Integrations/Integration/IntegrationOverviewTabV2/MarkdownContent'
import type { IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'

interface OverviewTabProps {
  integration: IntegrationDefinition
  isInstalled: boolean
}

export const OverviewTab = ({ integration, isInstalled }: OverviewTabProps) => {
  const { content, files = [] } = integration

  return (
    <div className="px-6 py-8 xl:px-10">
      <div className="mx-auto grid w-full max-w-[1080px] grid-cols-1 items-start gap-10 @4xl:grid-cols-[minmax(0,760px)_240px]">
        <div className="min-w-0">
          {files.length > 0 && <FilesViewer files={files} />}
          <MarkdownContent integrationId={integration.id} content={content} />
        </div>
        <MarketplaceDetailRail integration={integration} isInstalled={isInstalled} />
      </div>
    </div>
  )
}
