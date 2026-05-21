import type { ComponentProps } from 'react'
import { useMemo } from 'react'
import {
  Chart,
  ChartActions,
  ChartCard,
  ChartContent,
  ChartHeader,
  ChartLoadingState,
  ChartMetric,
} from 'ui-patterns/Chart'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { EdgeFunctionChartEmptyState } from './EdgeFunctionChartEmptyState'
import { EdgeFunctionInvocationsChart } from './EdgeFunctionInvocationsChart'
import { formatRate, getChartEmptyStateCopy } from './EdgeFunctionOverview.utils'
import type { InvocationChartDatum, InvocationUpdateAnnotation } from './EdgeFunctionOverview.utils'
import type { ChartIntervals } from '@/types'

interface EdgeFunctionInvocationsSectionProps {
  selectedInterval: ChartIntervals
  actions?: ComponentProps<typeof ChartActions>['actions']
  totalInvocationCount: number
  totalErrorCount: number
  totalWarningCount: number
  isLoadingChart: boolean
  isErrorChart: boolean
  chartErrorMessage?: string
  chartData: InvocationChartDatum[]
  onChartClick: () => void
  updateAnnotation?: InvocationUpdateAnnotation
}

export const EdgeFunctionInvocationsSection = ({
  selectedInterval,
  actions,
  totalInvocationCount,
  totalErrorCount,
  totalWarningCount,
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
  const invocationTitle = isLoadingChart
    ? 'Invocations'
    : `${totalInvocationCount.toLocaleString('en-US')} total invocations`

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>{invocationTitle}</PageSectionTitle>
        </PageSectionSummary>
        {actions && actions.length > 0 ? (
          <PageSectionAside className="flex-wrap @xl:self-center">
            <ChartActions actions={actions} />
          </PageSectionAside>
        ) : null}
      </PageSectionMeta>
      <PageSectionContent>
        <Chart isLoading={isLoadingChart}>
          <ChartCard>
            <ChartHeader align="start">
              <div className="flex flex-wrap gap-x-8 gap-y-4">
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
            </ChartHeader>
            <ChartContent
              isEmpty={isErrorChart || chartData.length === 0}
              emptyState={
                <EdgeFunctionChartEmptyState
                  title={emptyStateCopy.title}
                  description={emptyStateCopy.description}
                />
              }
              loadingState={<ChartLoadingState />}
            >
              <div className="h-40">
                <EdgeFunctionInvocationsChart
                  chartData={chartData}
                  dateTimeFormat={dateTimeFormat}
                  onChartClick={onChartClick}
                  updateAnnotation={updateAnnotation}
                />
              </div>
            </ChartContent>
          </ChartCard>
        </Chart>
      </PageSectionContent>
    </PageSection>
  )
}
