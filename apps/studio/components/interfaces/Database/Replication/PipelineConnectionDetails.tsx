import { AWS_REGIONS } from 'shared-data'
import { Card, CardContent } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { PIPELINE_REGION } from './DestinationPanel/DestinationForm/PipelineRegionField'
import { getDestinationStorageRegion } from './PipelineConnectionDetails.utils'
import { PipelineDetailItem } from './ReplicationPipelineStatus/PipelineDetailItem'
import { ReplicationRegionLabel } from './ReplicationRegionLabel'
import type { ReplicationDestinationByIdData } from '@/data/replication/destination-by-id-query'

const RegionValue = ({ code }: { code?: string }) => {
  if (!code) return <span className="text-foreground-light">Not available</span>
  const region = Object.values(AWS_REGIONS).find((region) => region.code === code)
  return (
    <div className="space-y-1">
      <ReplicationRegionLabel code={code} />
      {region && <span className="block font-mono text-xs text-foreground-lighter">{code}</span>}
    </div>
  )
}

export const PipelineConnectionDetails = ({
  sourceRegion,
  destinationConfig,
}: {
  sourceRegion?: string
  destinationConfig?: ReplicationDestinationByIdData['config']
}) => {
  const storageRegion = getDestinationStorageRegion(destinationConfig)
  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Connection details</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          <CardContent className="pb-5">
            <dl className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-3">
              <PipelineDetailItem label="Source database region">
                <RegionValue code={sourceRegion} />
              </PipelineDetailItem>
              <PipelineDetailItem label="Pipeline region">
                <RegionValue code={PIPELINE_REGION.code} />
              </PipelineDetailItem>
              {storageRegion && (
                <PipelineDetailItem label="Destination storage region">
                  <RegionValue code={storageRegion} />
                </PipelineDetailItem>
              )}
            </dl>
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
