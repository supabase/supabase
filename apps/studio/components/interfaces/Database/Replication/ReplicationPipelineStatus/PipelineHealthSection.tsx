import { Card, CardContent } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { PIPELINE_DETAIL_GRID_CLASS_NAME, PipelineDetailItem } from './PipelineDetailItem'
import { type SlotLagMetrics as SlotLagMetricsType } from './ReplicationPipelineStatus.types'
import { getWalStatusMeta } from './ReplicationPipelineStatus.utils'
import { getFieldDisplay, SLOT_LAG_FIELDS } from './SlotLagMetrics'
import {
  SLOT_CONNECTION_TOOLTIP,
  SLOT_STATUS_TOOLTIP,
  SlotConnectionValue,
  SlotWalStatusValue,
} from './SlotStatus'
import { InlineLink } from '@/components/ui/InlineLink'
import { DOCS_URL } from '@/lib/constants'

interface PipelineHealthSectionProps {
  metrics: SlotLagMetricsType
  isStale: boolean
}

export const PipelineHealthSection = ({ metrics, isStale }: PipelineHealthSectionProps) => {
  const walStatusMeta = getWalStatusMeta(metrics.wal_status)

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Pipeline health</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>

      <PageSectionContent className="flex flex-col gap-y-4">
        {isStale && (
          <Admonition
            type="note"
            title="Showing the last values we received"
            description="These metrics stop updating until the pipeline can be reached again."
          />
        )}

        <Card>
          <CardContent className="pb-5">
            <dl className={PIPELINE_DETAIL_GRID_CLASS_NAME}>
              <PipelineDetailItem label="Connection" tooltip={SLOT_CONNECTION_TOOLTIP}>
                <SlotConnectionValue isActive={metrics.active} />
              </PipelineDetailItem>

              <PipelineDetailItem
                label="Slot status"
                tooltip={SLOT_STATUS_TOOLTIP}
                description={
                  <>
                    {walStatusMeta.description}{' '}
                    <InlineLink
                      className="text-foreground-lighter hover:text-foreground"
                      href={`${DOCS_URL}/guides/database/replication/pipelines-monitoring#slot-statuses`}
                    >
                      Learn more
                    </InlineLink>
                  </>
                }
              >
                <SlotWalStatusValue status={metrics.wal_status} />
              </PipelineDetailItem>

              {SLOT_LAG_FIELDS.map((field) => {
                const { display, detail } = getFieldDisplay(field, metrics[field.key])

                return (
                  <PipelineDetailItem
                    key={field.key}
                    label={field.label}
                    tooltip={field.description}
                  >
                    {display}
                    {detail !== undefined && (
                      <span className="block text-xs text-foreground-lighter">{detail}</span>
                    )}
                  </PipelineDetailItem>
                )
              })}
            </dl>
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
