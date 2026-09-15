import { MessageSquare } from 'lucide-react'
import { Button } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { ReadReplicasMovedCallout } from '@/components/interfaces/Database/Replication/DestinationPanel/ReadReplicasMovedCallout'
import { Destinations } from '@/components/interfaces/Database/Replication/Destinations'
import { PIPELINES_FEEDBACK_URL } from '@/components/interfaces/Database/Replication/Replication.constants'
import { ReplicationDiagram } from '@/components/interfaces/Database/Replication/ReplicationDiagram'
import { InstanceConfiguration } from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration'
import DatabaseLayout from '@/components/layouts/DatabaseLayout/DatabaseLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { DocsButton } from '@/components/ui/DocsButton'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useHighAvailability } from '@/hooks/misc/useHighAvailability'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'
import type { NextPageWithLayout } from '@/types'

const DatabaseReplicationPage: NextPageWithLayout = () => {
  const { data: selectedProject, isPending } = useSelectedProjectQuery()
  const { isHighAvailability } = useHighAvailability()
  const showPgReplicate = useIsFeatureEnabled('database:replication')

  if (!showPgReplicate) {
    return <UnknownInterface urlBack={`/project/${selectedProject?.ref}/database/schemas`} />
  }

  if (isHighAvailability) {
    return (
      <>
        <PageHeader size="large">
          <PageHeaderMeta>
            <PageHeaderSummary>
              <PageHeaderTitle>Replication</PageHeaderTitle>
              <PageHeaderDescription>High Availability cluster topology</PageHeaderDescription>
            </PageHeaderSummary>
          </PageHeaderMeta>
        </PageHeader>

        <PageContainer size="large">
          <PageSection>
            <PageSectionContent>
              <div className="relative h-[500px] w-full overflow-hidden rounded-md border border-muted">
                <InstanceConfiguration />
              </div>
            </PageSectionContent>
          </PageSection>
        </PageContainer>
      </>
    )
  }

  return (
    <PipelineRequestStatusProvider>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Replication</PageHeaderTitle>
            <PageHeaderDescription>Send data to external destinations</PageHeaderDescription>
          </PageHeaderSummary>

          <PageHeaderAside>
            <Button asChild variant="default" icon={<MessageSquare />}>
              <a href={PIPELINES_FEEDBACK_URL} target="_blank" rel="noreferrer noopener">
                Leave feedback
              </a>
            </Button>
            <DocsButton href={`${DOCS_URL}/guides/database/replication`} />
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="large">
        {isPending ? (
          <GenericSkeletonLoader />
        ) : (
          <PageSection>
            <PageSectionContent className="flex flex-col gap-12">
              <ReadReplicasMovedCallout />
              <ReplicationDiagram />
              <Destinations />
            </PageSectionContent>
          </PageSection>
        )}
      </PageContainer>
    </PipelineRequestStatusProvider>
  )
}

DatabaseReplicationPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Replication">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseReplicationPage
