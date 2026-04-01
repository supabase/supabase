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

import { getExecutionTooltipDetails } from './EdgeFunctionMetricTooltipDetails'
import {
  EXECUTION_TIME_CHART_CONFIG,
  formatMetric,
  getChartEmptyStateCopy,
} from './EdgeFunctionOverview.utils'
import type { EdgeFunctionChartDatum } from './EdgeFunctionOverview.utils'
import { EdgeFunctionTimeSeriesChartCard } from './EdgeFunctionTimeSeriesChartCard'

interface EdgeFunctionPerformanceSectionProps {
  data: EdgeFunctionChartDatum[]
  dateTimeFormat: string
  isLoading: boolean
  isError: boolean
  errorMessage?: string
  averageExecutionTime: number
  maxExecutionTime: number
}

export const EdgeFunctionPerformanceSection = ({
  data,
  dateTimeFormat,
  isLoading,
  isError,
  errorMessage,
  averageExecutionTime,
  maxExecutionTime,
}: EdgeFunctionPerformanceSectionProps) => {
  const emptyStateCopy = getChartEmptyStateCopy('execution time', isError, errorMessage)
  const tooltipDetails = useMemo(
    () => getExecutionTooltipDetails(averageExecutionTime),
    [averageExecutionTime]
  )
  const metrics = (
    <div className="flex flex-wrap gap-x-8 gap-y-4">
      <ChartMetric
        label="Average Execution Time"
        value={formatMetric(averageExecutionTime, 'ms')}
        tooltip="Average execution time of function invocations"
      />
      <ChartMetric
        label="Max Execution Time"
        value={formatMetric(maxExecutionTime, 'ms')}
        tooltip="Maximum execution time of function invocations"
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
                <PageSectionTitle>Performance</PageSectionTitle>
              </PageSectionSummary>
            </PageSectionMeta>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <EdgeFunctionTimeSeriesChartCard
                className="lg:col-span-2"
                data={data}
                dateTimeFormat={dateTimeFormat}
                isLoading={isLoading}
                isError={isError}
                emptyTitle={emptyStateCopy.title}
                emptyDescription={emptyStateCopy.description}
                metrics={metrics}
                dataKey="max_execution_time"
                dataKeys={['avg_execution_time', 'max_execution_time']}
                config={EXECUTION_TIME_CHART_CONFIG}
                tooltipDetails={tooltipDetails}
                referenceLines={[
                  {
                    y: averageExecutionTime,
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
            </div>
          </div>
        </PageContainer>
      </PageSectionContent>
    </PageSection>
  )
}
