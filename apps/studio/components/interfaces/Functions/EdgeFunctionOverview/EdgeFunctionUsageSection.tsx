import { IS_PLATFORM } from 'common'
import { useMemo } from 'react'
import { ChartMetric } from 'ui-patterns/Chart'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { getCpuTooltipDetails, getMemoryTooltipDetails } from './EdgeFunctionMetricTooltipDetails'
import {
  CPU_TIME_CHART_CONFIG,
  formatMetric,
  formatRate,
  getChartEmptyStateCopy,
  MEMORY_CHART_CONFIG,
} from './EdgeFunctionOverview.utils'
import type { EdgeFunctionChartDatum } from './EdgeFunctionOverview.utils'
import { EdgeFunctionTimeSeriesChartCard } from './EdgeFunctionTimeSeriesChartCard'

interface EdgeFunctionUsageSectionProps {
  data: EdgeFunctionChartDatum[]
  dateTimeFormat: string
  isLoading: boolean
  isError: boolean
  errorMessage?: string
  averageCpuTime: number
  maxCpuTime: number
  averageMemoryUsage: number
  totalHeapMemory: number
  totalExternalMemory: number
  totalMemoryByType: number
}

export const EdgeFunctionUsageSection = ({
  data,
  dateTimeFormat,
  isLoading,
  isError,
  errorMessage,
  averageCpuTime,
  maxCpuTime,
  averageMemoryUsage,
  totalHeapMemory,
  totalExternalMemory,
  totalMemoryByType,
}: EdgeFunctionUsageSectionProps) => {
  const cpuEmptyStateCopy = getChartEmptyStateCopy('CPU time', isError, errorMessage)
  const memoryEmptyStateCopy = getChartEmptyStateCopy('memory usage', isError, errorMessage)
  const cpuTooltipDetails = useMemo(() => getCpuTooltipDetails(averageCpuTime), [averageCpuTime])
  const memoryTooltipDetails = useMemo(
    () => getMemoryTooltipDetails(averageMemoryUsage),
    [averageMemoryUsage]
  )
  const cpuMetrics = (
    <div className="flex flex-wrap gap-x-8 gap-y-4">
      <ChartMetric
        label="Average CPU Time"
        value={data.length === 0 || isError ? '–' : formatMetric(averageCpuTime, 'ms')}
        tooltip="Average CPU time usage for the function"
      />
      <ChartMetric
        label="Max CPU Time"
        value={data.length === 0 || isError ? '–' : formatMetric(maxCpuTime, 'ms')}
        tooltip="Maximum CPU time usage for the function"
      />
    </div>
  )
  const memoryMetrics = (
    <div className="flex flex-wrap gap-x-8 gap-y-4">
      <ChartMetric
        label="Average Memory Usage"
        value={data.length === 0 || isError ? '–' : formatMetric(averageMemoryUsage, 'MB')}
        tooltip="Average memory usage for the function"
      />
      <ChartMetric
        label="Heap"
        value={data.length === 0 || isError ? '–' : formatRate(totalHeapMemory, totalMemoryByType)}
        tooltip="Share of memory attributed to heap usage over the selected interval"
      />
      <ChartMetric
        label="External"
        value={
          data.length === 0 || isError ? '–' : formatRate(totalExternalMemory, totalMemoryByType)
        }
        tooltip="Share of memory attributed to external usage over the selected interval"
      />
    </div>
  )

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Usage</PageSectionTitle>
          {!IS_PLATFORM && (
            <PageSectionDescription>
              CPU and memory measured when workers shut down, across all requests served by each
              worker.
            </PageSectionDescription>
          )}
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <EdgeFunctionTimeSeriesChartCard
            data={data}
            dateTimeFormat={dateTimeFormat}
            isLoading={isLoading}
            isError={isError}
            emptyTitle={cpuEmptyStateCopy.title}
            emptyDescription={cpuEmptyStateCopy.description}
            metrics={cpuMetrics}
            dataKey="max_cpu_time_used"
            config={CPU_TIME_CHART_CONFIG}
            tooltipDetails={cpuTooltipDetails}
            referenceLines={[
              {
                y: averageCpuTime,
                label: 'average',
                stroke: 'var(--foreground-default)',
                strokeWidth: 1.5,
              },
            ]}
            yAxisProps={{
              tickFormatter: (value: number) => `${Math.round(value)}ms`,
            }}
          />

          <EdgeFunctionTimeSeriesChartCard
            data={data}
            dateTimeFormat={dateTimeFormat}
            isLoading={isLoading}
            isError={isError}
            emptyTitle={memoryEmptyStateCopy.title}
            emptyDescription={memoryEmptyStateCopy.description}
            metrics={memoryMetrics}
            dataKey="avg_memory_used"
            config={MEMORY_CHART_CONFIG}
            tooltipDetails={memoryTooltipDetails}
            referenceLines={[
              {
                y: averageMemoryUsage,
                label: 'average',
                stroke: 'var(--foreground-default)',
                strokeWidth: 1.5,
              },
            ]}
            yAxisProps={{
              tickFormatter: (value: number) => `${Number(value).toFixed(1)}MB`,
            }}
          />
        </div>
      </PageSectionContent>
    </PageSection>
  )
}
