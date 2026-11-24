import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { useId, type ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'
import { Button } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import type { WarehouseMetricsRange } from './WarehouseMetrics.range'
import { AlertError } from '@/components/ui/AlertError'
import type {
  WarehouseMetric,
  WarehouseMetricName,
} from '@/data/warehouse/warehouse-metrics-api-types'
import {
  warehouseMetricsQueryOptions,
  type WarehouseMetricsData,
} from '@/data/warehouse/warehouse-metrics-query'

const getStatus = (view: 'pending' | 'error' | 'success', label: string) => {
  switch (view) {
    case 'pending':
      return `Loading ${label} metrics`
    case 'error':
      return `Could not load ${label} metrics`
    case 'success':
      return `${label.charAt(0).toUpperCase()}${label.slice(1)} metrics loaded`
  }
}

export const WarehouseMetricsSection = ({
  title,
  description,
  statusLabel,
  attributes,
  range,
  children,
}: {
  title: string
  description: string
  /** Lowercase noun used in status and error text, such as `replication`. */
  statusLabel: string
  /** At most 8, the metrics API limit per request. */
  attributes: readonly WarehouseMetricName[]
  range: Extract<WarehouseMetricsRange, { status: 'ok' }>
  children: (
    getMetric: (name: WarehouseMetricName) => WarehouseMetric | undefined,
    data: WarehouseMetricsData
  ) => ReactNode
}) => {
  const { ref } = useParams()
  const headingId = useId()
  // Sections below the fold load when scrolled into view so the report doesn't queue every batch
  // at once against the metrics API's per-process limit. Without IntersectionObserver (such as in
  // jsdom), `fallbackInView` loads immediately.
  const { ref: inViewRef, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
    fallbackInView: true,
  })

  const query = useQuery(
    warehouseMetricsQueryOptions({
      projectRef: ref,
      attributes,
      startDate: range.startDate,
      endDate: range.endDate,
      interval: range.interval,
      enabled: inView,
    })
  )

  const getMetric = (name: WarehouseMetricName) =>
    query.data?.metrics.find((item) => item.metric === name)

  return (
    <section ref={inViewRef} aria-labelledby={headingId} className="relative space-y-4">
      <p role="status" className="sr-only">
        {getStatus(query.status, statusLabel)}
      </p>
      <div className="space-y-1">
        <h2 id={headingId} className="text-base">
          {title}
        </h2>
        <p className="text-sm text-foreground-light">{description}</p>
      </div>
      {query.isPending && <GenericSkeletonLoader aria-label={`Loading ${statusLabel} metrics`} />}
      {query.isError && (
        <AlertError
          projectRef={ref}
          error={query.error}
          subject={`Failed to retrieve ${statusLabel} metrics`}
          additionalActions={<Button onClick={() => query.refetch()}>Retry</Button>}
        />
      )}
      {query.isSuccess && children(getMetric, query.data)}
    </section>
  )
}
