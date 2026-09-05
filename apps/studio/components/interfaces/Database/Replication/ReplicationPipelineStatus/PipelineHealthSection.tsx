import { type ReactNode } from 'react'
import { Card, CardContent } from 'ui'
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
import { SLOT_STATUS_TOOLTIP, SlotWalStatusValue } from './SlotStatus'
import { InlineLink } from '@/components/ui/InlineLink'
import { DOCS_URL } from '@/lib/constants'

interface PipelineHealthSectionProps {
  /** Absent while the pipeline is stopped or failed and reports no slot metrics. */
  metrics?: SlotLagMetricsType
  /**
   * Every notice about the pipeline's state, in priority order. This section is the single place
   * they render, so a reader always finds "what needs my attention" at the top of Pipeline health.
   */
  children?: ReactNode
}

export const PipelineHealthSection = ({ metrics, children }: PipelineHealthSectionProps) => {
  const walStatusMeta = getWalStatusMeta(metrics?.wal_status)

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Pipeline health</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>

      <PageSectionContent className="flex flex-col gap-y-4">
        {children}

        {metrics !== undefined && (
          <Card>
            <CardContent className="pb-5">
              <dl className={PIPELINE_DETAIL_GRID_CLASS_NAME}>
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
        )}
      </PageSectionContent>
    </PageSection>
  )
}
