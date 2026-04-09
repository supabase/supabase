import type { ComponentProps } from 'react'
import { useMemo } from 'react'
import { Button } from 'ui'
import { Chart, ChartActions, ChartLoadingState, ChartMetric } from 'ui-patterns/Chart'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { EdgeFunctionChartEmptyState } from './EdgeFunctionChartEmptyState'
import { EdgeFunctionInvocationsChart } from './EdgeFunctionInvocationsChart'
import {
  EDGE_FUNCTION_CHART_INTERVALS,
  formatRate,
  getChartEmptyStateCopy,
  getSegmentedButtonClassName,
} from './EdgeFunctionOverview.utils'
import type { InvocationChartDatum, InvocationUpdateAnnotation } from './EdgeFunctionOverview.utils'
import { toAlertError } from './EdgeFunctionRecentErrors.utils'
import AlertError from '@/components/ui/AlertError'
import type { ChartIntervals } from '@/types'

interface EdgeFunctionInvocationsSectionProps {
  interval: string
  onIntervalChange: (interval: string) => void
  selectedInterval: ChartIntervals
  actions?: ComponentProps<typeof ChartActions>['actions']
  totalInvocationCount: number
  totalErrorCount: number
  totalWarningCount: number
  isLoadingFunction: boolean
  isErrorFunction: boolean
  functionError?: unknown
  isLoadingChart: boolean
  isErrorChart: boolean
  chartErrorMessage?: string
  chartData: InvocationChartDatum[]
  onChartClick: () => void
  updateAnnotation?: InvocationUpdateAnnotation
}

export const EdgeFunctionInvocationsSection = ({
  interval,
  onIntervalChange,
  selectedInterval,
  actions,
  totalInvocationCount,
  totalErrorCount,
  totalWarningCount,
  isLoadingFunction,
  isErrorFunction,
  functionError,
  isLoadingChart,
  isErrorChart,
  chartErrorMessage,
  chartData,
  onChartClick,
  updateAnnotation,
}: EdgeFunctionInvocationsSectionProps) => {
  const dateTimeFormat = selectedInterval.format ?? 'MMM D, h:mma'
  const emptyStateCopy = useMemo(
    () => getChartEmptyStateCopy('invocations', isErrorChart, chartErrorMessage),
    [chartErrorMessage, isErrorChart]
  )

  return (
    <PageSection className="bg-surface-100/50 border-b pb-10 pt-8">
      <PageSectionContent>
        <PageContainer size="full">
          <div className="flex flex-col gap-5">
            <PageSectionMeta className="!items-center">
              <PageSectionSummary>
                <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
                  <ChartMetric
                    label="Total Invocations"
                    value={totalInvocationCount}
                    status="default"
                    tooltip="Total number of invocations"
                  />
                  <ChartMetric
                    label="5xx Rate"
                    value={formatRate(totalErrorCount, totalInvocationCount)}
                    status="negative"
                    tooltip="Share of invocations that returned a 5xx status code"
                  />
                  <ChartMetric
                    label="4xx Rate"
                    value={formatRate(totalWarningCount, totalInvocationCount)}
                    status="warning"
                    tooltip="Share of invocations that returned a 4xx status code"
                  />
                </div>
              </PageSectionSummary>
              <PageSectionAside className="flex-wrap @xl:self-center">
                <div className="flex items-center">
                  {EDGE_FUNCTION_CHART_INTERVALS.map((item, index) => {
                    return (
                      <Button
                        key={`function-filter-${item.key}`}
                        type={interval === item.key ? 'secondary' : 'default'}
                        onClick={() => onIntervalChange(item.key)}
                        className={getSegmentedButtonClassName(
                          index,
                          EDGE_FUNCTION_CHART_INTERVALS.length
                        )}
                      >
                        {item.label}
                      </Button>
                    )
                  })}
                </div>
                <ChartActions actions={actions} />
              </PageSectionAside>
            </PageSectionMeta>

            <div>
              {isLoadingFunction && <GenericSkeletonLoader />}
              {isErrorFunction && (
                <AlertError
                  error={toAlertError(functionError)}
                  subject="Failed to retrieve edge function details"
                  layout="vertical"
                />
              )}
            </div>

            <div>
              <Chart isLoading={isLoadingChart}>
                {isLoadingChart ? (
                  <ChartLoadingState />
                ) : isErrorChart || chartData.length === 0 ? (
                  <EdgeFunctionChartEmptyState
                    title={emptyStateCopy.title}
                    description={emptyStateCopy.description}
                  />
                ) : (
                  <EdgeFunctionInvocationsChart
                    chartData={chartData}
                    dateTimeFormat={dateTimeFormat}
                    onChartClick={onChartClick}
                    updateAnnotation={updateAnnotation}
                  />
                )}
              </Chart>
            </div>
          </div>
        </PageContainer>
      </PageSectionContent>
    </PageSection>
  )
}
