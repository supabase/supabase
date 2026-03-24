import type { EdgeFunctionChartDatum } from 'components/interfaces/Functions/EdgeFunctionOverview.utils'
import {
  Chart,
  ChartCard,
  ChartContent,
  ChartHeader,
  ChartLine,
  ChartLoadingState,
  ChartMetric,
} from 'ui-patterns/Chart'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { EdgeFunctionChartEmptyState } from './EdgeFunctionChartEmptyState'
import {
  CPU_TIME_CHART_CONFIG,
  formatMetric,
  formatRate,
  formatReferenceDelta,
  getChartEmptyStateCopy,
  getMemoryTooltipDetail,
  MEMORY_CHART_CONFIG,
} from './EdgeFunctionOverview.utils'

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

const renderCpuTooltipDetails = (
  averageCpuTime: number,
  _: EdgeFunctionChartDatum,
  __: string,
  value: unknown
) => (
  <span className="text-foreground">
    {formatReferenceDelta(Number(value ?? 0), averageCpuTime)}
  </span>
)

const renderMemoryTooltipDetails = (
  averageMemoryUsage: number,
  datum: EdgeFunctionChartDatum,
  _: string,
  value: unknown
) => (
  <>
    <span className="text-foreground">
      {formatReferenceDelta(Number(value ?? 0), averageMemoryUsage)}
    </span>
    <span className="text-foreground-light">
      {getMemoryTooltipDetail(
        Number(datum.avg_heap_memory_used ?? 0),
        Number(datum.avg_external_memory_used ?? 0)
      )}
    </span>
  </>
)

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
              <Chart isLoading={isLoading}>
                <ChartCard>
                  <ChartHeader align="start">
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
                  </ChartHeader>
                  <ChartContent
                    isEmpty={isError || data.length === 0}
                    emptyState={
                      <EdgeFunctionChartEmptyState
                        title={cpuEmptyStateCopy.title}
                        description={cpuEmptyStateCopy.description}
                      />
                    }
                    loadingState={<ChartLoadingState />}
                  >
                    <div className="h-40">
                      <ChartLine
                        data={data}
                        dataKey="max_cpu_time_used"
                        DateTimeFormat={dateTimeFormat}
                        isFullHeight
                        showYAxis
                        config={CPU_TIME_CHART_CONFIG}
                        tooltipDetails={renderCpuTooltipDetails.bind(null, averageCpuTime)}
                        referenceLines={[
                          {
                            y: averageCpuTime,
                            label: 'average',
                            stroke: 'hsl(var(--foreground-default))',
                            strokeWidth: 1.5,
                          },
                        ]}
                        YAxisProps={{
                          width: 64,
                          tickFormatter: (value: number) => `${Math.round(value)}ms`,
                        }}
                      />
                    </div>
                  </ChartContent>
                </ChartCard>
              </Chart>

              <Chart isLoading={isLoading}>
                <ChartCard>
                  <ChartHeader align="start">
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
                  </ChartHeader>
                  <ChartContent
                    isEmpty={isError || data.length === 0}
                    emptyState={
                      <EdgeFunctionChartEmptyState
                        title={memoryEmptyStateCopy.title}
                        description={memoryEmptyStateCopy.description}
                      />
                    }
                    loadingState={<ChartLoadingState />}
                  >
                    <div className="h-40">
                      <ChartLine
                        data={data}
                        dataKey="avg_memory_used"
                        DateTimeFormat={dateTimeFormat}
                        isFullHeight
                        showYAxis
                        config={MEMORY_CHART_CONFIG}
                        tooltipDetails={renderMemoryTooltipDetails.bind(null, averageMemoryUsage)}
                        referenceLines={[
                          {
                            y: averageMemoryUsage,
                            label: 'average',
                            stroke: 'hsl(var(--foreground-default))',
                            strokeWidth: 1.5,
                          },
                        ]}
                        YAxisProps={{
                          width: 64,
                          tickFormatter: (value: number) => `${Number(value).toFixed(1)}MB`,
                        }}
                      />
                    </div>
                  </ChartContent>
                </ChartCard>
              </Chart>
            </div>
          </div>
        </PageContainer>
      </PageSectionContent>
    </PageSection>
  )
}
