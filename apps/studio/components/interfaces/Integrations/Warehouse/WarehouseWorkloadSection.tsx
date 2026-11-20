import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { ArrowUpRightIcon, RefreshCwIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  getWorkloadStatus,
  getWorkloadView,
  type WorkloadView,
} from './WarehouseWorkloadSection.utils'
import { WarehouseMetricChart } from '@/components/interfaces/Observability/Warehouse/WarehouseMetricChart'
import { AlertError } from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import { warehouseMetricsQueryOptions } from '@/data/warehouse/warehouse-metrics-query'

const getRange = () => {
  const end = dayjs().startOf('minute')
  return { startDate: end.subtract(1, 'hour').toISOString(), endDate: end.toISOString() }
}

export const WarehouseWorkloadSection = () => {
  const { ref } = useParams()
  const [range, setRange] = useState(getRange)

  const query = useQuery(
    warehouseMetricsQueryOptions({
      projectRef: ref,
      attributes: ['query_rate', 'query_duration_p95'],
      ...range,
      interval: '1m',
    })
  )
  const view = getWorkloadView(query)

  const handleRefresh = () => {
    const nextRange = getRange()
    setRange(nextRange)
    if (nextRange.endDate === range.endDate) query.refetch()
  }

  return (
    <PageSection>
      <PageSectionMeta className="flex-row items-end @xl:items-end justify-between gap-3">
        <PageSectionSummary>
          <PageSectionTitle>Workload</PageSectionTitle>
          <PageSectionDescription>Query activity in the last 60 minutes.</PageSectionDescription>
        </PageSectionSummary>
        <div
          role="group"
          aria-label="Workload actions"
          className="flex shrink-0 items-center gap-2"
        >
          <Button
            variant="text"
            aria-label="Refresh report"
            title="Refresh report"
            icon={<RefreshCwIcon size={14} />}
            disabled={query.isFetching}
            onClick={handleRefresh}
          />
          <Button asChild variant="default" iconRight={<ArrowUpRightIcon size={14} />}>
            <InlineLink className="no-underline" href={`/project/${ref}/observability/warehouse`}>
              Observability
            </InlineLink>
          </Button>
        </div>
      </PageSectionMeta>
      <PageSectionContent className="relative">
        <p role="status" aria-label="Workload status" className="sr-only">
          {getWorkloadStatus(view)}
        </p>
        <WarehouseWorkloadBody view={view} projectRef={ref} />
      </PageSectionContent>
    </PageSection>
  )
}

const WarehouseWorkloadBody = ({
  view,
  projectRef,
}: {
  view: WorkloadView
  projectRef?: string
}) => {
  switch (view.kind) {
    case 'loading':
      return <GenericSkeletonLoader aria-label="Loading workload metrics" />
    case 'error':
      return (
        <AlertError
          subject="Failed to load Warehouse metrics"
          error={view.error}
          projectRef={projectRef}
        />
      )
    case 'unavailable':
      return (
        <Admonition
          layout="responsive"
          title="Warehouse metrics are unavailable"
          description="Replication status is shown above."
        />
      )
    case 'ready':
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <WarehouseMetricChart
            title="Query duration (p95)"
            description="Includes worker waits and result streaming."
            metric={view.data.metrics.find((item) => item.metric === 'query_duration_p95')}
            unit="ms"
            scale={1000}
            emptyMessage="No data in the last 60 minutes"
          />
          <WarehouseMetricChart
            title="Query rate"
            description="Queries started per second. Not a count of SQL statements."
            metric={view.data.metrics.find((item) => item.metric === 'query_rate')}
            unit="/s"
            emptyMessage="No data in the last 60 minutes"
          />
        </div>
      )
  }
}
