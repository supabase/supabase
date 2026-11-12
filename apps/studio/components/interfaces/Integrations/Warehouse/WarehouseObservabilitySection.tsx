import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { RefreshCwIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button, Card, CardContent, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { WarehouseLoadingState } from './WarehouseLoadingState'
import {
  getWarehouseSummaryNotice,
  getWarehouseSummaryPoints,
  getWarehouseSummaryRange,
  getWarehouseSummaryValue,
  WAREHOUSE_SUMMARY_ATTRIBUTES,
  type WarehouseSummaryValue,
} from './WarehouseObservabilitySection.utils'
import { WarehouseWorkloadChart } from './WarehouseWorkloadChart'
import { AlertError } from '@/components/ui/AlertError'
import { InlineLink } from '@/components/ui/InlineLink'
import { warehouseKeys } from '@/data/warehouse/keys'
import { warehouseMetricsQueryOptions } from '@/data/warehouse/warehouse-metrics-query'

const formatNumber = (value: number) =>
  value.toLocaleString(undefined, { maximumSignificantDigits: 3 })

const SummaryMetric = ({
  label,
  metric,
  value,
  description,
}: {
  label: string
  metric: WarehouseSummaryValue
  value: string | null
  description: string
}) => {
  const notice = getWarehouseSummaryNotice(metric)
  return (
    <div className="space-y-1">
      <dt className="text-sm text-foreground-light">
        <Tooltip>
          <TooltipTrigger className="underline decoration-dotted underline-offset-4">
            {label}
          </TooltipTrigger>
          <TooltipContent className="max-w-72">{description}</TooltipContent>
        </Tooltip>
      </dt>
      <dd className="text-lg tabular-nums">{value ?? 'Unavailable'}</dd>
      {notice && <p className="text-xs text-foreground-light">{notice}</p>}
    </div>
  )
}

const WorkloadSection = ({
  children,
  isExample = false,
}: {
  children: ReactNode
  isExample?: boolean
}) => (
  <PageSection className="pt-5!">
    <PageSectionMeta>
      <PageSectionSummary>
        <PageSectionTitle>Workload</PageSectionTitle>
        <PageSectionDescription>
          {isExample ? 'Query performance appears after setup.' : 'Query performance and capacity.'}
        </PageSectionDescription>
      </PageSectionSummary>
    </PageSectionMeta>
    <PageSectionContent className="space-y-4">{children}</PageSectionContent>
  </PageSection>
)

const WarehouseWorkloadPreview = () => {
  return (
    <WorkloadSection isExample>
      <div className="grid gap-4 sm:grid-cols-2">
        {['Query duration', 'Query rate'].map((title) => (
          <Card key={title}>
            <CardContent className="space-y-3 p-4">
              <h3 className="text-sm text-foreground-light">{title}</h3>
              <svg
                aria-hidden="true"
                viewBox="0 0 300 100"
                preserveAspectRatio="none"
                className="h-36 w-full text-foreground-muted opacity-30"
                fill="none"
              >
                <path d="M0 25H300M0 50H300M0 75H300" stroke="currentColor" strokeOpacity="0.3" />
                <path
                  d="M0 80C25 80 25 60 50 65S75 85 100 55S125 65 150 45S175 60 200 30S225 45 250 25S275 35 300 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </CardContent>
          </Card>
        ))}
      </div>
    </WorkloadSection>
  )
}

const WarehouseWorkloadWaiting = () => (
  <WorkloadSection>
    <Card>
      <CardContent className="py-8 text-sm text-foreground-light">
        Query measurements appear once Warehouse is ready and you run queries.
      </CardContent>
    </Card>
  </WorkloadSection>
)

export const WarehouseObservabilitySection = ({
  mode = 'live',
}: {
  mode?: 'live' | 'example' | 'waiting'
}) => {
  if (mode === 'example') return <WarehouseWorkloadPreview />
  if (mode === 'waiting') return <WarehouseWorkloadWaiting />
  return <WarehouseWorkloadMetrics />
}

const WarehouseWorkloadMetrics = () => {
  const { ref: projectRef } = useParams()
  const queryClient = useQueryClient()
  const [range, setRange] = useState(getWarehouseSummaryRange)
  const { data, error, isPending, isError, isFetching, refetch } = useQuery(
    warehouseMetricsQueryOptions({
      projectRef,
      attributes: WAREHOUSE_SUMMARY_ATTRIBUTES,
      ...range,
      interval: '1m',
    })
  )

  const handleRefresh = async () => {
    const nextRange = getWarehouseSummaryRange()
    await queryClient.invalidateQueries({
      queryKey: warehouseKeys.metricsAll(projectRef),
      refetchType: 'none',
    })
    setRange(nextRange)
    if (range.endDate === nextRange.endDate) await refetch()
  }

  const renderSummary = () => {
    if (isPending) return <WarehouseLoadingState label="Loading workload metrics..." />
    if (isError)
      return (
        <AlertError
          subject="Failed to load Warehouse metrics"
          error={error}
          projectRef={projectRef}
          additionalActions={
            <Button variant="default" onClick={handleRefresh} loading={isFetching}>
              Retry
            </Button>
          }
        />
      )
    if (!data) return null

    const isUnavailable =
      data.metrics.length > 0 &&
      data.metrics.every(
        (metric) => metric.availability === 'not_provisioned' || metric.availability === 'disabled'
      )
    if (isUnavailable)
      return (
        <Card>
          <CardContent className="py-8 text-sm text-foreground-light">
            Warehouse metrics are unavailable. Replication status is shown above.
          </CardContent>
        </Card>
      )

    const rate = getWarehouseSummaryValue(data, 'query_rate')
    const duration = getWarehouseSummaryValue(data, 'query_duration_p95')
    const errors = getWarehouseSummaryValue(data, 'query_error_rate')
    const occupied = getWarehouseSummaryValue(data, 'worker_admission_occupied')
    const limit = getWarehouseSummaryValue(data, 'worker_admission_limit')
    const capacityValue =
      occupied.value !== null && limit.value !== null && occupied.timestamp === limit.timestamp
        ? `${formatNumber(occupied.value)} / ${formatNumber(limit.value)}`
        : null
    const capacitySource = occupied.value === null ? occupied : limit
    const capacityAvailability =
      occupied.availability === 'partial' || limit.availability === 'partial'
        ? 'partial'
        : occupied.availability
    const capacityMetric: WarehouseSummaryValue =
      capacityValue !== null
        ? { ...occupied, availability: capacityAvailability }
        : { ...capacitySource, value: null, timestamp: null }

    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2">
          <WarehouseWorkloadChart
            title="Query duration (p95)"
            unit="ms"
            description="Includes worker waits and result streaming."
            points={getWarehouseSummaryPoints(data, 'query_duration_p95', 1000)}
            metric={duration}
            value={
              duration.value === null ? undefined : `${formatNumber(duration.value * 1000)} ms`
            }
          />
          <WarehouseWorkloadChart
            title="Query rate"
            unit="/s"
            description="Work started per second, including metadata lookups."
            points={getWarehouseSummaryPoints(data, 'query_rate')}
            metric={rate}
            value={rate.value === null ? undefined : `${formatNumber(rate.value)}/s`}
          />
        </div>
        <Card>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <SummaryMetric
                label="Query errors"
                metric={errors}
                value={errors.value === null ? null : `${formatNumber(errors.value)}/s`}
                description="Includes timeouts. Cancellations are separate."
              />
              <SummaryMetric
                label="Worker slots in use"
                metric={capacityMetric}
                value={capacityValue}
                description="Active and pending capacity grants, rather than SQL query counts."
              />
            </dl>
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <WorkloadSection>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-foreground-light">
          {dayjs(range.startDate).format('MMM D, HH:mm')} to{' '}
          {dayjs(range.endDate).format('MMM D, HH:mm')} · 1-minute samples
        </p>
        <Button
          variant="text"
          aria-label="Refresh workload summary"
          icon={<RefreshCwIcon size={14} />}
          disabled={isFetching}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </div>
      {renderSummary()}
      <div className="flex justify-end">
        <Button asChild variant="default">
          <InlineLink
            className="no-underline"
            href={`/project/${projectRef}/observability/warehouse`}
          >
            View metrics
          </InlineLink>
        </Button>
      </div>
    </WorkloadSection>
  )
}
