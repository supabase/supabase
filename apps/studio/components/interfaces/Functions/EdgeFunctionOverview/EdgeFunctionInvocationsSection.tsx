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
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { EdgeFunctionChartEmptyState } from './EdgeFunctionChartEmptyState'
import { EdgeFunctionInvocationsChart } from './EdgeFunctionInvocationsChart'
import { formatRate, getChartEmptyStateCopy } from './EdgeFunctionOverview.utils'
import type { InvocationChartDatum, InvocationUpdateAnnotation } from './EdgeFunctionOverview.utils'
import { toAlertError } from './EdgeFunctionRecentErrors.utils'
import { AlertError } from '@/components/ui/AlertError'

interface EdgeFunctionInvocationsSectionProps {
  dateTimeFormat: string
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
  onChartClick: (timestamp: string) => void
  updateAnnotation?: InvocationUpdateAnnotation
}

export const EdgeFunctionInvocationsSection = ({
  dateTimeFormat,
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
  const emptyStateCopy = useMemo(
    () => getChartEmptyStateCopy('invocations', isErrorChart, chartErrorMessage),
    [chartErrorMessage, isErrorChart]
  )

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Invocations</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>

      <PageSectionContent className="flex flex-col gap-5">
        {isLoadingFunction && <GenericSkeletonLoader />}
        {isErrorFunction && (
          <AlertError
            error={toAlertError(functionError)}
            subject="Failed to retrieve edge function details"
            layout="vertical"
          />
        )}

        <Chart isLoading={isLoadingChart}>
          <ChartCard>
            <ChartHeader align="start">
              <div className="flex flex-wrap gap-x-8 gap-y-4">
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
              <ChartActions actions={actions} />
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
              <EdgeFunctionInvocationsChart
                chartData={chartData}
                dateTimeFormat={dateTimeFormat}
                onChartClick={onChartClick}
                updateAnnotation={updateAnnotation}
              />
            </ChartContent>
          </ChartCard>
        </Chart>
      </PageSectionContent>
    </PageSection>
  )
}
