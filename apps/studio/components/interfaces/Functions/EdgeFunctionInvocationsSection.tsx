import AlertError from 'components/ui/AlertError'
import { Rocket } from 'lucide-react'
import type { ComponentProps } from 'react'
import {
  Bar,
  CartesianGrid,
  BarChart as RechartBarChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import type { ChartIntervals } from 'types'
import { Button, ChartContainer, ChartTooltip, ChartTooltipContent } from 'ui'
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
import {
  EDGE_FUNCTION_CHART_INTERVALS,
  formatChartTimestamp,
  formatRate,
  getChartEmptyStateCopy,
  getChartTimeRangeLabels,
  getSegmentedButtonClassName,
  INVOCATION_CHART_CONFIG,
} from './EdgeFunctionOverview.utils'
import type { InvocationChartDatum, InvocationUpdateAnnotation } from './EdgeFunctionOverview.utils'

type InvocationActions = ComponentProps<typeof ChartActions>['actions']

interface EdgeFunctionInvocationsSectionProps {
  interval: string
  onIntervalChange: (interval: string) => void
  selectedInterval: ChartIntervals
  actions?: InvocationActions
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

const toAlertError = (error: unknown): { message: string } | undefined => {
  if (typeof error === 'string') return { message: error }

  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return { message }
  }

  return undefined
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
  const emptyStateCopy = getChartEmptyStateCopy('invocations', isErrorChart, chartErrorMessage)
  const timeRangeLabels = getChartTimeRangeLabels(chartData, dateTimeFormat)

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
                  <div className="flex flex-col gap-1">
                    <div className="relative h-40 w-full overflow-visible">
                      <ChartContainer
                        config={INVOCATION_CHART_CONFIG}
                        className="!aspect-auto !h-full !w-full"
                      >
                        <RechartBarChart
                          data={chartData}
                          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                          onClick={onChartClick}
                        >
                          <CartesianGrid vertical={false} />
                          <YAxis hide width={0} />
                          <XAxis
                            dataKey="timestamp"
                            tickLine={false}
                            axisLine={false}
                            tick={false}
                            minTickGap={32}
                          />
                          <ChartTooltip
                            cursor={false}
                            content={
                              <ChartTooltipContent
                                className="text-foreground-light"
                                labelFormatter={(value) =>
                                  formatChartTimestamp(
                                    value as string | number | undefined,
                                    dateTimeFormat
                                  )
                                }
                                indicator="dot"
                              />
                            }
                          />
                          <Bar
                            dataKey="error_count"
                            stackId="invocations"
                            fill="var(--color-error_count)"
                            maxBarSize={24}
                          />
                          <Bar
                            dataKey="warning_count"
                            stackId="invocations"
                            fill="var(--color-warning_count)"
                            maxBarSize={24}
                          />
                          <Bar
                            dataKey="ok_count"
                            stackId="invocations"
                            fill="var(--color-ok_count)"
                            maxBarSize={24}
                          />
                          {updateAnnotation && (
                            <ReferenceLine
                              x={updateAnnotation.timestamp}
                              stroke="hsl(var(--foreground-default))"
                              strokeDasharray="4 4"
                              strokeWidth={1.5}
                            />
                          )}
                        </RechartBarChart>
                      </ChartContainer>
                      {updateAnnotation && (
                        <span
                          className="pointer-events-none absolute bottom-0 z-10 flex h-6 w-6 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border border-foreground/20 bg-background text-foreground shadow-sm"
                          style={{ left: `${updateAnnotation.position}%` }}
                          title={`Updated ${updateAnnotation.updatedAt.format(dateTimeFormat)}`}
                        >
                          <Rocket size={12} strokeWidth={1.75} />
                        </span>
                      )}
                    </div>
                    {timeRangeLabels && (
                      <div className="-mt-6 flex items-center justify-between text-[10px] font-mono text-foreground-lighter">
                        <span>{timeRangeLabels.start}</span>
                        <span>{timeRangeLabels.end}</span>
                      </div>
                    )}
                  </div>
                )}
              </Chart>
            </div>
          </div>
        </PageContainer>
      </PageSectionContent>
    </PageSection>
  )
}
