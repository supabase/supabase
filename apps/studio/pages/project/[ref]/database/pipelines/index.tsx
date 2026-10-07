import { useParams } from 'common'
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
import { GenericTableLoader, ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { Destinations } from '@/components/interfaces/Database/Replication/Destinations'
import { PIPELINES_FEEDBACK_URL } from '@/components/interfaces/Database/Replication/Replication.constants'
import { ReplicationDiagram } from '@/components/interfaces/Database/Replication/ReplicationDiagram'
import { InstanceConfiguration } from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration'
import { PipelinesLayout } from '@/components/layouts/DatabaseLayout/PipelinesLayout'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { DocsButton } from '@/components/ui/DocsButton'
import { UnknownInterface } from '@/components/ui/UnknownInterface'
import { useHighAvailability } from '@/hooks/misc/useHighAvailability'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { DOCS_URL } from '@/lib/constants'
import type { NextPageWithLayout } from '@/types'

const DatabasePipelinesPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const { isHighAvailability, isPending } = useHighAvailability()
  const showPgReplicate = useIsFeatureEnabled('database:replication')

  if (!showPgReplicate) {
    return <UnknownInterface urlBack={`/project/${projectRef}/database/schemas`} />
  }

  if (isHighAvailability) {
    return (
      <>
        <PageHeader size="large">
          <PageHeaderMeta>
            <PageHeaderSummary>
              <PageHeaderTitle>Pipelines</PageHeaderTitle>
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
    <>
      <PageHeader size="large">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Pipelines</PageHeaderTitle>
            <PageHeaderDescription>Send data to external destinations</PageHeaderDescription>
          </PageHeaderSummary>

          <PageHeaderAside>
            <Button asChild variant="default" icon={<MessageSquare />}>
              <a href={PIPELINES_FEEDBACK_URL} target="_blank" rel="noreferrer noopener">
                Leave feedback
              </a>
            </Button>
            <DocsButton href={`${DOCS_URL}/guides/database/replication/pipelines`} />
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="large">
        <PageSection>
          <PageSectionContent className="flex flex-col gap-12">
            {isPending ? (
              <>
                <p className="sr-only" role="status">
                  Loading pipelines
                </p>
                <div
                  className="flex h-[350px] items-center justify-center gap-8 rounded-md border border-muted"
                  aria-hidden="true"
                >
                  <ShimmeringLoader className="h-14 w-36 py-0" />
                  <ShimmeringLoader className="h-14 w-36 py-0" />
                </div>
                <div className="w-full space-y-4" aria-hidden="true">
                  <div className="flex items-center justify-between">
                    <ShimmeringLoader className="h-8 w-52 py-0" />
                    <div className="flex items-center gap-x-2">
                      <ShimmeringLoader className="h-8 w-8 py-0" />
                      <ShimmeringLoader className="h-8 w-32 py-0" />
                    </div>
                  </div>
                  <GenericTableLoader
                    headers={[null, 'Name', 'Status', 'Lag', 'Publication', null]}
                  />
                </div>
              </>
            ) : (
              <>
                <ReplicationDiagram />
                <Destinations />
              </>
            )}
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}

DatabasePipelinesPage.getLayout = (page) => (
  <DefaultLayout>
    <PipelinesLayout>{page}</PipelinesLayout>
  </DefaultLayout>
)

export default DatabasePipelinesPage
