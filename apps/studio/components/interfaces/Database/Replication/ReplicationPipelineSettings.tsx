import { useParams } from 'common'
import { Edit } from 'lucide-react'
import { parseAsInteger, useQueryState } from 'nuqs'
import { Button, Card, CardContent } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { DestinationPanel } from './DestinationPanel/DestinationPanel'
import { AlertError } from '@/components/ui/AlertError'
import { useReplicationPipelineByIdQuery } from '@/data/replication/pipeline-by-id-query'

const ConfigurationRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col justify-between gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
    <span className="text-sm text-foreground-light">{label}</span>
    <span className="text-sm text-foreground">{value}</span>
  </div>
)

export const ReplicationPipelineSettings = () => {
  const { ref: projectRef, pipelineId: pipelineIdParam } = useParams()
  const pipelineId = Number(pipelineIdParam)
  const [edit, setEdit] = useQueryState(
    'edit',
    parseAsInteger.withOptions({ history: 'push', clearOnDefault: true })
  )
  const {
    data: pipeline,
    error,
    isPending,
    isError,
  } = useReplicationPipelineByIdQuery({
    projectRef,
    pipelineId,
  })

  return (
    <PageContainer size="small">
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Pipeline configuration</PageSectionTitle>
            <PageSectionDescription>
              Review the source and destination used by this pipeline.
            </PageSectionDescription>
          </PageSectionSummary>
          {pipeline !== undefined && (
            <PageSectionAside>
              <Button icon={<Edit />} onClick={() => setEdit(pipeline.destination_id)}>
                Edit destination
              </Button>
            </PageSectionAside>
          )}
        </PageSectionMeta>

        <PageSectionContent>
          {isPending ? (
            <GenericSkeletonLoader />
          ) : isError ? (
            <AlertError error={error} subject="Failed to retrieve pipeline information" />
          ) : pipeline !== undefined ? (
            <Card>
              <CardContent className="divide-y divide-border py-4">
                <ConfigurationRow label="Destination" value={pipeline.destination_name} />
                <ConfigurationRow label="Source" value={pipeline.source_name} />
                <ConfigurationRow label="Publication" value={pipeline.config.publication_name} />
              </CardContent>
            </Card>
          ) : null}
        </PageSectionContent>
      </PageSection>

      {edit !== null && <DestinationPanel />}
    </PageContainer>
  )
}
