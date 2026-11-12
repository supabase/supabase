import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { RefreshCwIcon } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, CardContent, CardFooter } from 'ui'
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
  getWarehouseSummaryRange,
  getWarehouseSummaryValue,
  WAREHOUSE_SUMMARY_ATTRIBUTES,
  type WarehouseSummaryValue,
} from './WarehouseObservabilitySection.utils'
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
      <dt className="text-sm text-foreground-light">{label}</dt>
      <dd className="space-y-1">
        <p className="text-xl text-foreground">{value ?? 'Unavailable'}</p>
        {notice && <p className="text-xs text-foreground-light">{notice}</p>}
        {metric.timestamp !== null && (
          <p className="text-xs text-foreground-lighter">
            Interval ending {dayjs.unix(metric.timestamp).format('MMM D, HH:mm')}
          </p>
        )}
        <p className="text-xs text-foreground-lighter">{description}</p>
      </dd>
    </div>
  )
}

export const WarehouseObservabilitySection = () => {
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
    if (isError) {
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
    }
    if (!data) return null

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
      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <SummaryMetric
          label="Query rate"
          metric={rate}
          value={rate.value === null ? null : `${formatNumber(rate.value)}/s`}
          description="Includes metadata lookups."
        />
        <SummaryMetric
          label="Query duration (p95)"
          metric={duration}
          value={duration.value === null ? null : `${formatNumber(duration.value * 1000)} ms`}
          description="Includes worker waits and result streaming."
        />
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
    )
  }

  return (
    <PageSection className="pt-5!">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Workload</PageSectionTitle>
          <PageSectionDescription>
            Latest observations in this 60-minute window. Metrics are collected every minute.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-foreground-light">
                {dayjs(range.startDate).format('MMM D, HH:mm')} to{' '}
                {dayjs(range.endDate).format('MMM D, HH:mm')}
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
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-lg text-xs text-foreground-light">
              Compare workload, latency, and capacity before changing your layout. Choosing
              partitioning or sorting rules also needs query and table details.
            </p>
            <Button asChild variant="default">
              <InlineLink
                className="no-underline"
                href={`/project/${projectRef}/observability/warehouse`}
              >
                View metrics
              </InlineLink>
            </Button>
          </CardFooter>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
