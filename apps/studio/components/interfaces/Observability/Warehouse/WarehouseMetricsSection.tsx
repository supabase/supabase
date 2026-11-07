import type { UseQueryResult } from '@tanstack/react-query'
import { Button, Card, CardContent } from 'ui'

import type { WarehouseSectionDef } from './WarehouseMetrics.constants'
import { WarehouseMetricsChart } from './WarehouseMetricsChart'
import { ReportSectionHeader } from '@/components/interfaces/Reports/v2/ReportSectionHeader'
import { AlertError } from '@/components/ui/AlertError'
import type {
  WarehouseMetricsData,
  WarehouseMetricsError,
} from '@/data/warehouse/warehouse-metrics-query'

interface WarehouseMetricsSectionProps {
  section: WarehouseSectionDef
  query: Pick<
    UseQueryResult<WarehouseMetricsData, WarehouseMetricsError>,
    'data' | 'error' | 'isError' | 'isPending' | 'isSuccess' | 'refetch'
  >
  projectRef: string | undefined
  syncId: string
  updateDateRange: (from: string, to: string) => void
}

export const WarehouseMetricsSection = ({
  section,
  query,
  projectRef,
  syncId,
  updateDateRange,
}: WarehouseMetricsSectionProps) => {
  const { data, error, isError, isPending, isSuccess, refetch } = query

  return (
    <section id={section.id} className="mt-8">
      <ReportSectionHeader
        id={section.id}
        title={section.title}
        description={section.description}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {isPending &&
          section.charts.map((chart) => (
            <Card key={chart.id} aria-label={`Loading ${chart.title}`}>
              <CardContent className="flex min-h-[200px] flex-col gap-3 p-4">
                <div className="h-4 w-32 animate-pulse rounded bg-surface-300" />
                <div className="flex-1 animate-pulse rounded bg-surface-200" />
              </CardContent>
            </Card>
          ))}
        {isError && (
          <div className="md:col-span-2">
            <AlertError
              projectRef={projectRef}
              error={error}
              subject={`Failed to retrieve ${section.title.toLowerCase()} data`}
              additionalActions={
                <Button variant="default" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          </div>
        )}
        {isSuccess &&
          data &&
          section.charts.map((chart) => (
            <WarehouseMetricsChart
              key={chart.id}
              chart={chart}
              response={data}
              syncId={syncId}
              updateDateRange={updateDateRange}
              onRetry={() => refetch()}
            />
          ))}
      </div>
    </section>
  )
}
