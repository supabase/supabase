import { Card, CardContent } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { DEFAULT_MAX_TABLE_SYNC_WORKERS } from '../DestinationPanel/DestinationForm/DestinationForm.constants'
import { PIPELINE_REGION } from '../Replication.constants'
import { getReplicationDestinationTarget } from '../ReplicationDiagram/Nodes.utils'
import { PIPELINE_DETAIL_GRID_CLASS_NAME, PipelineDetailItem } from './PipelineDetailItem'
import { RegionFlag } from '@/components/ui/RegionFlag'
import { ReplicationDestinationByIdData } from '@/data/replication/destination-by-id-query'
import { ReplicationPipelineByIdData } from '@/data/replication/pipeline-by-id-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface PipelineConfigurationSectionProps {
  pipeline: ReplicationPipelineByIdData
  destination?: ReplicationDestinationByIdData
}

export const PipelineConfigurationSection = ({
  pipeline,
  destination,
}: PipelineConfigurationSectionProps) => {
  const { data: project } = useSelectedProjectQuery()
  const destinationTarget = getReplicationDestinationTarget(
    destination?.config as Record<string, unknown> | undefined
  )

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Configuration</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>

      <PageSectionContent>
        <Card>
          <CardContent className="pb-5">
            <dl className={PIPELINE_DETAIL_GRID_CLASS_NAME}>
              <PipelineDetailItem label="Destination" description={destinationTarget}>
                {pipeline.destination_name}
              </PipelineDetailItem>
              <PipelineDetailItem label="Source" description={pipeline.source_name}>
                <span className="flex items-center gap-x-2">
                  {project?.region !== undefined && (
                    <RegionFlag className="w-4 shrink-0" region={project.region} />
                  )}
                  Primary database
                </span>
              </PipelineDetailItem>
              <PipelineDetailItem
                label="Publication"
                tooltip="The Postgres publication this pipeline reads from, which determines which tables are replicated"
              >
                {pipeline.config.publication_name}
              </PipelineDetailItem>
              <PipelineDetailItem
                label="Table sync workers"
                tooltip="How many tables copy at the same time during an initial sync"
              >
                {pipeline.config.max_table_sync_workers ?? DEFAULT_MAX_TABLE_SYNC_WORKERS}
              </PipelineDetailItem>
              <PipelineDetailItem
                label="Pipeline region"
                tooltip="Every pipeline runs from this region, regardless of where your project is"
                description={PIPELINE_REGION.code}
              >
                <span className="flex items-center gap-x-2">
                  <RegionFlag className="w-4 shrink-0" region={PIPELINE_REGION.code} />
                  {PIPELINE_REGION.displayName}
                </span>
              </PipelineDetailItem>
            </dl>
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
