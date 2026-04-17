import { useMemo } from 'react'
import { ChartMetric } from 'ui-patterns/Chart'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionContent,
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
        value={formatMetric(averageCpuTime, 'ms')}
        tooltip="Average CPU time usage for the function"
      />
      <ChartMetric
        label="Max CPU Time"
        value={formatMetric(maxCpuTime, 'ms')}
        tooltip="Maximum CPU time usage for the function"
      />
    </div>
  )
  const memoryMetrics = (
    <div className="flex flex-wrap gap-x-8 gap-y-4">
      <ChartMetric
        label="Average Memory Usage"
        value={formatMetric(averageMemoryUsage, 'MB')}
        tooltip="Average memory usage for the function"
      />
      <ChartMetric
        label="Heap"
        value={formatRate(totalHeapMemory, totalMemoryByType)}
        tooltip="Share of memory attributed to heap usage over the selected interval"
      />
      <ChartMetric
        label="External"
        value={formatRate(totalExternalMemory, totalMemoryByType)}
        tooltip="Share of memory attributed to external usage over the selected interval"
      />
    </div>
  )

  return (
    <PageSection>
      <PageSectionContent>
        <PageContainer size="full">
          <div className="flex flex-col gap-6">
            <PageSectionMeta>
              <PageSectionSummary>
                <PageSectionTitle>Usage</PageSectionTitle>
              </PageSectionSummary>
            </PageSectionMeta>

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
                    stroke: 'hsl(var(--foreground-default))',
                    strokeWidth: 1.5,
                  },
                ]}
                yAxisProps={{
                  width: 64,
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
                    stroke: 'hsl(var(--foreground-default))',
                    strokeWidth: 1.5,
                  },
                ]}
                yAxisProps={{
                  width: 64,
                  tickFormatter: (value: number) => `${Number(value).toFixed(1)}MB`,
                }}
              />
            </div>
          </div>
        </PageContainer>
      </PageSectionContent>
    </PageSection>
  )
}
