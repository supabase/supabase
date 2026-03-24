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
  EXECUTION_TIME_CHART_CONFIG,
  formatMetric,
  formatReferenceDelta,
  getChartEmptyStateCopy,
} from './EdgeFunctionOverview.utils'

interface EdgeFunctionPerformanceSectionProps {
  data: EdgeFunctionChartDatum[]
  dateTimeFormat: string
  isLoading: boolean
  isError: boolean
  errorMessage?: string
  averageExecutionTime: number
  maxExecutionTime: number
}

const renderExecutionTooltipDetails = (
  averageExecutionTime: number,
  _: EdgeFunctionChartDatum,
  key: string,
  value: unknown
) =>
  key === 'max_execution_time' ? (
    <span className="text-foreground">
      {formatReferenceDelta(Number(value ?? 0), averageExecutionTime)}
    </span>
  ) : null

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
              <Chart isLoading={isLoading} className="lg:col-span-2">
                <ChartCard>
                  <ChartHeader align="start">
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
                  </ChartHeader>
                  <ChartContent
                    isEmpty={isError || data.length === 0}
                    emptyState={
                      <EdgeFunctionChartEmptyState
                        title={emptyStateCopy.title}
                        description={emptyStateCopy.description}
                      />
                    }
                    loadingState={<ChartLoadingState />}
                  >
                    <div className="h-40">
                      <ChartLine
                        data={data}
                        dataKey="max_execution_time"
                        dataKeys={['avg_execution_time', 'max_execution_time']}
                        DateTimeFormat={dateTimeFormat}
                        isFullHeight
                        showYAxis
                        config={EXECUTION_TIME_CHART_CONFIG}
                        tooltipDetails={renderExecutionTooltipDetails.bind(
                          null,
                          averageExecutionTime
                        )}
                        referenceLines={[
                          {
                            y: averageExecutionTime,
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
            </div>
          </div>
        </PageContainer>
      </PageSectionContent>
    </PageSection>
  )
}
