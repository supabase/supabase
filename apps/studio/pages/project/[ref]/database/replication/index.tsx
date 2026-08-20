import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { Destinations } from '@/components/interfaces/Database/Replication/Destinations'
import { ReplicationDiagram } from '@/components/interfaces/Database/Replication/ReplicationDiagram'
import { InstanceConfiguration } from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration'
import DatabaseLayout from '@/components/layouts/DatabaseLayout/DatabaseLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useHighAvailability } from '@/hooks/misc/useHighAvailability'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
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
            <PageHeaderDescription>Read replicas and analytics pipelines</PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="large">
        {isPending ? (
          <GenericSkeletonLoader />
        ) : (
          <PageSection>
            <PageSectionContent className="flex flex-col gap-12">
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
