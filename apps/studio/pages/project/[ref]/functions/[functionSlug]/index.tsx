import { PermissionAction } from '@supabase/shared-types/out/constants'
import { IS_PLATFORM, useParams } from 'common'
import { useUnifiedLogsPreview } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { parseEdgeFunctionEventMessage } from 'components/interfaces/Functions/EdgeFunctionRecentInvocations.utils'
import { LOGS_TABLES } from 'components/interfaces/Settings/Logs/Logs.constants'
import DefaultLayout from 'components/layouts/DefaultLayout'
import EdgeFunctionDetailsLayout from 'components/layouts/EdgeFunctionsLayout/EdgeFunctionDetailsLayout'
import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import {
  FunctionsCombinedStatsVariables,
  useFunctionsCombinedStatsQuery,
} from 'data/analytics/functions-combined-stats-query'
import { useEdgeFunctionQuery } from 'data/edge-functions/edge-function-query'
import dayjs, { Dayjs } from 'dayjs'
import { useFillTimeseriesSorted } from 'hooks/analytics/useFillTimeseriesSorted'
import useLogsPreview from 'hooks/analytics/useLogsPreview'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import maxBy from 'lodash/maxBy'
import meanBy from 'lodash/meanBy'
import sumBy from 'lodash/sumBy'
import { BarChart2, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import { Area, CartesianGrid, AreaChart as RechartAreaChart, XAxis, YAxis } from 'recharts'
import type { ChartIntervals, NextPageWithLayout } from 'types'
import type { ChartConfig } from 'ui'
import {
  Button,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from 'ui'
import {
  Chart,
  ChartActions,
  ChartCard,
  ChartContent,
  ChartEmptyState,
  ChartHeader,
  ChartLine,
  ChartLoadingState,
  ChartMetric,
} from 'ui-patterns/Chart'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

const CHART_INTERVALS: ChartIntervals[] = [
  {
    key: '15min',
    label: '15 min',
    startValue: 15,
    startUnit: 'minute',
    format: 'MMM D, h:mm:ssa',
  },
  {
    key: '1hr',
    label: '1 hour',
    startValue: 1,
    startUnit: 'hour',
    format: 'MMM D, h:mma',
  },
  {
    key: '3hr',
    label: '3 hours',
    startValue: 3,
    startUnit: 'hour',
    format: 'MMM D, h:mma',
  },
  {
    key: '1day',
    label: '1 day',
    startValue: 1,
    startUnit: 'hour',
    format: 'MMM D, h:mma',
  },
]

const INVOCATION_CHART_CONFIG = {
  ok_count: {
    label: 'Ok',
    color: 'hsl(var(--brand-default))',
  },
  warning_count: {
    label: 'Warnings',
    color: 'hsl(var(--warning-default))',
  },
  error_count: {
    label: 'Errors',
    color: 'hsl(var(--destructive-default))',
  },
} satisfies ChartConfig

const PageLayout: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref: projectRef, functionSlug } = useParams()
  const { isEnabled: isUnifiedLogsEnabled } = useUnifiedLogsPreview()

  const [interval, setInterval] = useState<string>('15min')
  const selectedInterval = CHART_INTERVALS.find((i) => i.key === interval) || CHART_INTERVALS[1]
  const {
    data: selectedFunction,
    error: functionError,
    isPending: isLoadingFunction,
    isError: isErrorFunction,
  } = useEdgeFunctionQuery({
    projectRef,
    slug: functionSlug,
  })
  const id = selectedFunction?.id
  const combinedStatsResults = useFunctionsCombinedStatsQuery(
    {
      projectRef,
      functionId: id,
      interval: selectedInterval.key as FunctionsCombinedStatsVariables['interval'],
    },
    {
      enabled: IS_PLATFORM,
    }
  )

  const combinedStatsData = useMemo(() => {
    const result = combinedStatsResults.data?.result as
      | Record<string, string | number>[]
      | undefined
    return result || []
  }, [combinedStatsResults.data])

  const [startDate, endDate]: [Dayjs, Dayjs] = useMemo(() => {
    const start = dayjs()
      .subtract(selectedInterval.startValue, selectedInterval.startUnit as dayjs.ManipulateType)
      .startOf(selectedInterval.startUnit as dayjs.ManipulateType)

    const end = dayjs().startOf(selectedInterval.startUnit as dayjs.ManipulateType)
    return [start, end]
  }, [selectedInterval])

  const {
    data: combinedStatsChartData,
    error: combinedStatsError,
    isError: isErrorCombinedStats,
  } = useFillTimeseriesSorted({
    data: combinedStatsData,
    timestampKey: 'timestamp',
    valueKey: [
      'requests_count',
      'log_count',
      'log_info_count',
      'log_warn_count',
      'log_error_count',
      'success_count',
      'redirect_count',
      'client_err_count',
      'server_err_count',
      'avg_cpu_time_used',
      'avg_memory_used',
      'avg_execution_time',
      'max_execution_time',
      'avg_heap_memory_used',
      'avg_external_memory_used',
      'max_cpu_time_used',
    ],
    defaultValue: 0,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  })

  const { logData: recentInvocationLogs, isLoading: isLoadingRecentInvocationLogs } =
    useLogsPreview({
      projectRef: projectRef as string,
      table: LOGS_TABLES.fn_edge,
      filterOverride: { function_id: id ?? '__pending__' },
      limit: 100,
    })

  const recentInvocationDots = useMemo(
    () =>
      recentInvocationLogs
        .slice(0, 100)
        .reverse()
        .map((item) => {
          const statusCode = String(item.status_code ?? '')
          const statusCodeNumber = Number(item.status_code)
          const isError = Number.isFinite(statusCodeNumber) && statusCodeNumber >= 500
          const method = String(item.method ?? '')
          const message = parseEdgeFunctionEventMessage(
            String(item.event_message ?? ''),
            method || undefined,
            statusCode || undefined
          )

          return {
            id: String(item.id ?? ''),
            timestamp: Number(item.timestamp),
            method,
            message,
            statusCode,
            isError,
            executionTime:
              item.execution_time_ms !== undefined
                ? `${Math.round(Number(item.execution_time_ms))}ms`
                : undefined,
            deploymentId: String(item.deployment_id ?? ''),
            version: String(item.version ?? ''),
          }
        }),
    [recentInvocationLogs]
  )

  const invocationChartData = useMemo(
    () =>
      combinedStatsChartData.map((d: any) => ({
        timestamp: String(d.timestamp),
        ok_count: Number(d.success_count ?? 0),
        warning_count: Number(d.redirect_count ?? 0) + Number(d.client_err_count ?? 0),
        error_count: Number(d.server_err_count ?? 0),
      })),
    [combinedStatsChartData]
  )
  const totalInvocationCount = useMemo(
    () => sumBy(invocationChartData, (d) => d.ok_count + d.warning_count + d.error_count),
    [invocationChartData]
  )
  const totalWarningCount = useMemo(
    () => sumBy(invocationChartData, 'warning_count'),
    [invocationChartData]
  )
  const totalErrorCount = useMemo(
    () => sumBy(invocationChartData, 'error_count'),
    [invocationChartData]
  )

  const memoryByTypeChartData = useMemo(
    () =>
      combinedStatsChartData.map((d: any) => ({
        timestamp: String(d.timestamp),
        heap: Number(d.avg_heap_memory_used ?? 0),
        external: Number(d.avg_external_memory_used ?? 0),
      })),
    [combinedStatsChartData]
  )
  const totalHeapMemory = useMemo(
    () => sumBy(memoryByTypeChartData, 'heap'),
    [memoryByTypeChartData]
  )
  const totalExternalMemory = useMemo(
    () => sumBy(memoryByTypeChartData, 'external'),
    [memoryByTypeChartData]
  )
  const totalMemoryByType = totalHeapMemory + totalExternalMemory

  const invocationActions = useMemo(
    () => [
      {
        label: isUnifiedLogsEnabled ? 'Open logs' : 'Open invocations',
        href: `/project/${projectRef}/functions/${functionSlug}/${
          isUnifiedLogsEnabled ? 'logs' : 'invocations'
        }`,
        icon: <ExternalLink size={12} />,
      },
    ],
    [functionSlug, isUnifiedLogsEnabled, projectRef]
  )

  const formatMetric = (value?: number, unit?: string) => {
    if (value === undefined || Number.isNaN(value)) return unit ? `0${unit}` : '0'

    const formatted = unit === 'MB' ? value.toFixed(1) : Math.round(value).toLocaleString('en-US')

    return unit ? `${formatted}${unit}` : formatted
  }

  const formatRate = (count: number, total: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'percent',
      maximumFractionDigits: 1,
    }).format(total === 0 ? 0 : count / total)

  const renderChartEmptyState = (title: string, description?: string) => (
    <ChartEmptyState
      icon={<BarChart2 size={16} />}
      title={title}
      description={description ?? 'It may take up to 24 hours for data to refresh'}
    />
  )

  const { isLoading: permissionsLoading, can: canReadFunction } = useAsyncCheckPermissions(
    PermissionAction.FUNCTIONS_READ,
    functionSlug as string
  )

  useEffect(() => {
    if (!IS_PLATFORM && projectRef && functionSlug) {
      router.replace(`/project/${projectRef}/functions/${functionSlug}/details`)
    }
  }, [functionSlug, projectRef, router])

  if (!canReadFunction && !permissionsLoading) {
    return <NoPermission isFullPage resourceText="access this edge function" />
  }

  if (!IS_PLATFORM) {
    return null
  }

  return (
    <>
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
                      label="Error Rate"
                      value={formatRate(totalErrorCount, totalInvocationCount)}
                      status="negative"
                      tooltip="Share of invocations that returned a server error"
                    />
                    <ChartMetric
                      label="Warning Rate"
                      value={formatRate(totalWarningCount, totalInvocationCount)}
                      status="warning"
                      tooltip="Share of invocations that returned a redirect or client error"
                    />
                  </div>
                </PageSectionSummary>
                <PageSectionAside className="flex-wrap @xl:self-center">
                  <div className="flex items-center">
                    {CHART_INTERVALS.map((item, i) => {
                      const classes = []

                      if (i === 0) {
                        classes.push('rounded-tr-none rounded-br-none')
                      } else if (i === CHART_INTERVALS.length - 1) {
                        classes.push('rounded-tl-none rounded-bl-none')
                      } else {
                        classes.push('rounded-none')
                      }

                      return (
                        <Button
                          key={`function-filter-${i}`}
                          type={interval === item.key ? 'secondary' : 'default'}
                          onClick={() => setInterval(item.key)}
                          className={classes.join(' ')}
                        >
                          {item.label}
                        </Button>
                      )
                    })}
                  </div>
                  <ChartActions actions={invocationActions} />
                </PageSectionAside>
              </PageSectionMeta>

              <div>
                {isLoadingFunction && <GenericSkeletonLoader />}
                {isErrorFunction && (
                  <AlertError
                    error={functionError}
                    subject="Failed to retrieve edge function details"
                    layout="vertical"
                  />
                )}
              </div>

              <div className="-mx-6 xl:-mx-10">
                <Chart isLoading={combinedStatsResults.isLoading}>
                  {combinedStatsResults.isLoading ? (
                    <ChartLoadingState />
                  ) : isErrorCombinedStats || invocationChartData.length === 0 ? (
                    renderChartEmptyState(
                      isErrorCombinedStats ? 'Unable to load invocations' : 'No data to show',
                      isErrorCombinedStats
                        ? combinedStatsError?.message ?? 'Unknown error'
                        : undefined
                    )
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="h-56 w-full">
                        <ChartContainer
                          config={INVOCATION_CHART_CONFIG}
                          className="!aspect-auto !h-full !w-full"
                        >
                          <RechartAreaChart
                            data={invocationChartData}
                            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                            onClick={() => {
                              router.push(
                                `/project/${projectRef}/functions/${functionSlug}/${
                                  isUnifiedLogsEnabled ? 'logs' : 'invocations'
                                }${isUnifiedLogsEnabled ? '' : `?its=${startDate.toISOString()}`}`
                              )
                            }}
                          >
                            <defs>
                              <linearGradient id="fill-invocations-ok" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                  offset="5%"
                                  stopColor="var(--color-ok_count)"
                                  stopOpacity={0.35}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="var(--color-ok_count)"
                                  stopOpacity={0.06}
                                />
                              </linearGradient>
                              <linearGradient
                                id="fill-invocations-warning"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="var(--color-warning_count)"
                                  stopOpacity={0.35}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="var(--color-warning_count)"
                                  stopOpacity={0.06}
                                />
                              </linearGradient>
                              <linearGradient
                                id="fill-invocations-error"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="var(--color-error_count)"
                                  stopOpacity={0.35}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="var(--color-error_count)"
                                  stopOpacity={0.06}
                                />
                              </linearGradient>
                            </defs>
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
                                    dayjs(String(value)).format(selectedInterval.format)
                                  }
                                  indicator="dot"
                                />
                              }
                            />
                            <Area
                              type="stepAfter"
                              dataKey="error_count"
                              stackId="invocations"
                              stroke="var(--color-error_count)"
                              fill="url(#fill-invocations-error)"
                              strokeWidth={1.5}
                            />
                            <Area
                              type="stepAfter"
                              dataKey="warning_count"
                              stackId="invocations"
                              stroke="var(--color-warning_count)"
                              fill="url(#fill-invocations-warning)"
                              strokeWidth={1.5}
                            />
                            <Area
                              type="stepAfter"
                              dataKey="ok_count"
                              stackId="invocations"
                              stroke="var(--color-ok_count)"
                              fill="url(#fill-invocations-ok)"
                              strokeWidth={1.5}
                            />
                          </RechartAreaChart>
                        </ChartContainer>
                      </div>
                      <div className="-mt-6 px-6 text-[10px] font-mono text-foreground-lighter xl:px-10 flex items-center justify-between">
                        <span>
                          {dayjs(invocationChartData[0]?.timestamp).format(selectedInterval.format)}
                        </span>
                        <span>
                          {dayjs(
                            invocationChartData[invocationChartData.length - 1]?.timestamp
                          ).format(selectedInterval.format)}
                        </span>
                      </div>
                    </div>
                  )}
                </Chart>
              </div>
            </div>
          </PageContainer>
        </PageSectionContent>
      </PageSection>

      <PageSection>
        <PageSectionContent>
          <PageContainer size="full">
            <div className="flex flex-col gap-6">
              <PageSectionMeta>
                <PageSectionSummary>
                  <PageSectionTitle>Recent Invocations</PageSectionTitle>
                </PageSectionSummary>
              </PageSectionMeta>

              {isLoadingRecentInvocationLogs && recentInvocationDots.length === 0 ? (
                <div
                  className="grid w-full items-center gap-1"
                  style={{
                    gridTemplateColumns: `repeat(100, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: 100 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[50px] w-px rounded-full bg-foreground-lighter opacity-70"
                      style={{
                        opacity: 0.75 - i * 0.005,
                      }}
                    />
                  ))}
                </div>
              ) : recentInvocationDots.length === 0 ? (
                <div className="rounded-md border border-dashed px-4 py-6 text-sm text-foreground-light">
                  Invocation logs will appear here when requests are made to this function.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div
                    className="grid w-full items-center gap-1"
                    style={{
                      gridTemplateColumns: `repeat(${recentInvocationDots.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {recentInvocationDots.map((invocation, index) => (
                      <HoverCard key={invocation.id}>
                        <HoverCardTrigger asChild>
                          <button
                            type="button"
                            className="flex h-[50px] min-w-0 items-center justify-center rounded-sm transition-colors hover:bg-surface-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                            aria-label={`Invocation ${index + 1}: ${
                              invocation.statusCode || 'No status'
                            } ${invocation.method || ''}`.trim()}
                          >
                            <span
                              className={[
                                'h-[50px] w-px rounded-full transition-opacity hover:opacity-80',
                                invocation.isError ? 'bg-destructive' : 'bg-foreground-lighter',
                              ].join(' ')}
                            />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent side="top" className="w-[320px]">
                          <div className="flex flex-col gap-3 text-sm">
                            <div className="space-y2">
                              <h4 className="heading-meta text-foreground-light">Timestamp</h4>
                              <p className="text-foreground">
                                {dayjs(invocation.timestamp).format('MMM D, YYYY h:mm:ss A')}
                              </p>
                            </div>
                            <div className="space-y2">
                              <h4 className="heading-meta text-foreground-light">Method</h4>
                              <p className="text-foreground">{invocation.method || '-'}</p>
                            </div>
                            <div className="space-y2">
                              <h4 className="heading-meta text-foreground-light">Result</h4>
                              <p
                                className={[
                                  invocation.isError ? 'text-destructive' : 'text-foreground',
                                ].join(' ')}
                              >
                                {invocation.statusCode || '-'}
                              </p>
                            </div>
                            <div className="space-y2">
                              <h4 className="heading-meta text-foreground-light">Duration</h4>
                              <p className="text-foreground">{invocation.executionTime ?? '-'}</p>
                            </div>
                            <div className="space-y2">
                              <h4 className="heading-meta text-foreground-light">ID</h4>
                              <p className="text-foreground">{invocation.id}</p>
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-foreground-lighter">
                    <span>Oldest</span>
                    <span>Newest</span>
                  </div>
                </div>
              )}

              {/*
                {recentInvocationLogs.length > 0 && (
                  <Table className="@xl:-mx-10">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-6 xl:px-10">Timestamp</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead className="text-right">Duration</TableHead>
                        <TableHead className="px-6 xl:px-10 w-full">Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentInvocationLogs.slice(0, 6).map((item) => {
                        const statusCode = String(item.status_code ?? '')
                        const statusCodeNumber = Number(item.status_code)
                        const isSuccessStatus = statusCodeNumber === 200
                        const isErrorRow =
                          Number.isFinite(statusCodeNumber) && statusCodeNumber >= 500
                        const method = String(item.method ?? '')
                        const parsedMessage = parseEdgeFunctionEventMessage(
                          String(item.event_message ?? ''),
                          method || undefined,
                          statusCode || undefined
                        )

                        return (
                          <TableRow
                            key={item.id}
                            className={
                              isErrorRow
                                ? 'cursor-pointer font-mono bg-destructive-200'
                                : 'cursor-pointer font-mono'
                            }
                            onClick={() =>
                              router.push(
                                `/project/${projectRef}/functions/${functionSlug}/${
                                  isUnifiedLogsEnabled ? 'logs' : 'invocations'
                                }?${isUnifiedLogsEnabled ? 'id' : 'log'}=${item.id}`
                              )
                            }
                          >
                            <TableCell className="px-6 xl:px-10 text-foreground-light text-xs py-2 whitespace-nowrap">
                              {dayjs(item.timestamp).format('MMM D, YYYY h:mm A')}
                            </TableCell>
                            <TableCell className="text-xs py-2 whitespace-nowrap">
                              {statusCode ? (
                                <Badge
                                  variant={
                                    isSuccessStatus
                                      ? 'default'
                                      : isErrorRow
                                        ? 'destructive'
                                        : 'default'
                                  }
                                  className="font-mono"
                                >
                                  {statusCode}
                                </Badge>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                            <TableCell className="text-xs py-2 whitespace-nowrap">
                              {method || '-'}
                            </TableCell>
                            <TableCell className="text-xs py-2 max-w-48 truncate">
                              {String(item.id ?? '-')}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-xs py-2 whitespace-nowrap">
                              {item.execution_time_ms !== undefined
                                ? `${Math.round(Number(item.execution_time_ms))}ms`
                                : '-'}
                            </TableCell>
                            <TableCell className="px-6 xl:px-10 text-foreground-light text-xs py-2 max-w-0">
                              <span className="block truncate">{parsedMessage || '-'}</span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
                */}
            </div>
          </PageContainer>
        </PageSectionContent>
      </PageSection>

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
                <Chart isLoading={combinedStatsResults.isLoading}>
                  <ChartCard>
                    <ChartHeader>
                      <ChartMetric
                        label="Average Execution Time"
                        value={formatMetric(
                          meanBy(combinedStatsChartData, 'avg_execution_time'),
                          'ms'
                        )}
                        tooltip="Average execution time of function invocations"
                      />
                    </ChartHeader>
                    <ChartContent
                      isEmpty={isErrorCombinedStats || combinedStatsChartData.length === 0}
                      emptyState={renderChartEmptyState(
                        isErrorCombinedStats ? 'Unable to load execution time' : 'No data to show',
                        isErrorCombinedStats
                          ? combinedStatsError?.message ?? 'Unknown error'
                          : undefined
                      )}
                      loadingState={<ChartLoadingState />}
                    >
                      <div className="h-40">
                        <ChartLine
                          data={combinedStatsChartData}
                          dataKey="avg_execution_time"
                          DateTimeFormat={selectedInterval.format}
                          isFullHeight
                          showYAxis
                          YAxisProps={{
                            width: 64,
                            tickFormatter: (value: number) => `${Math.round(value)}ms`,
                          }}
                        />
                      </div>
                    </ChartContent>
                  </ChartCard>
                </Chart>

                <Chart isLoading={combinedStatsResults.isLoading}>
                  <ChartCard>
                    <ChartHeader>
                      <ChartMetric
                        label="Max Execution Time"
                        value={formatMetric(
                          maxBy(combinedStatsChartData, 'max_execution_time')
                            ?.max_execution_time as number | undefined,
                          'ms'
                        )}
                        tooltip="Maximum execution time of function invocations"
                      />
                    </ChartHeader>
                    <ChartContent
                      isEmpty={isErrorCombinedStats || combinedStatsChartData.length === 0}
                      emptyState={renderChartEmptyState(
                        isErrorCombinedStats
                          ? 'Unable to load max execution time'
                          : 'No data to show',
                        isErrorCombinedStats
                          ? combinedStatsError?.message ?? 'Unknown error'
                          : undefined
                      )}
                      loadingState={<ChartLoadingState />}
                    >
                      <div className="h-40">
                        <ChartLine
                          data={combinedStatsChartData}
                          dataKey="max_execution_time"
                          DateTimeFormat={selectedInterval.format}
                          isFullHeight
                          showYAxis
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
                <Chart isLoading={combinedStatsResults.isLoading}>
                  <ChartCard>
                    <ChartHeader>
                      <ChartMetric
                        label="Average CPU Time"
                        value={formatMetric(
                          meanBy(combinedStatsChartData, 'avg_cpu_time_used'),
                          'ms'
                        )}
                        tooltip="Average CPU time usage for the function"
                      />
                    </ChartHeader>
                    <ChartContent
                      isEmpty={isErrorCombinedStats || combinedStatsChartData.length === 0}
                      emptyState={renderChartEmptyState(
                        isErrorCombinedStats ? 'Unable to load CPU time' : 'No data to show',
                        isErrorCombinedStats
                          ? combinedStatsError?.message ?? 'Unknown error'
                          : undefined
                      )}
                      loadingState={<ChartLoadingState />}
                    >
                      <div className="h-40">
                        <ChartLine
                          data={combinedStatsChartData}
                          dataKey="avg_cpu_time_used"
                          DateTimeFormat={selectedInterval.format}
                          isFullHeight
                          showYAxis
                          YAxisProps={{
                            width: 64,
                            tickFormatter: (value: number) => `${Math.round(value)}ms`,
                          }}
                        />
                      </div>
                    </ChartContent>
                  </ChartCard>
                </Chart>

                <Chart isLoading={combinedStatsResults.isLoading}>
                  <ChartCard>
                    <ChartHeader>
                      <ChartMetric
                        label="Max CPU Time"
                        value={formatMetric(
                          maxBy(combinedStatsChartData, 'max_cpu_time_used')?.max_cpu_time_used as
                            | number
                            | undefined,
                          'ms'
                        )}
                        tooltip="Maximum CPU time usage for the function"
                      />
                    </ChartHeader>
                    <ChartContent
                      isEmpty={isErrorCombinedStats || combinedStatsChartData.length === 0}
                      emptyState={renderChartEmptyState(
                        isErrorCombinedStats ? 'Unable to load max CPU time' : 'No data to show',
                        isErrorCombinedStats
                          ? combinedStatsError?.message ?? 'Unknown error'
                          : undefined
                      )}
                      loadingState={<ChartLoadingState />}
                    >
                      <div className="h-40">
                        <ChartLine
                          data={combinedStatsChartData}
                          dataKey="max_cpu_time_used"
                          DateTimeFormat={selectedInterval.format}
                          isFullHeight
                          showYAxis
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

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Chart isLoading={combinedStatsResults.isLoading}>
                  <ChartCard>
                    <ChartHeader>
                      <ChartMetric
                        label="Average Memory Usage"
                        value={formatMetric(
                          meanBy(combinedStatsChartData, 'avg_memory_used'),
                          'MB'
                        )}
                        tooltip="Average memory usage for the function"
                      />
                    </ChartHeader>
                    <ChartContent
                      isEmpty={isErrorCombinedStats || combinedStatsChartData.length === 0}
                      emptyState={renderChartEmptyState(
                        isErrorCombinedStats ? 'Unable to load memory usage' : 'No data to show',
                        isErrorCombinedStats
                          ? combinedStatsError?.message ?? 'Unknown error'
                          : undefined
                      )}
                      loadingState={<ChartLoadingState />}
                    >
                      <div className="h-40">
                        <ChartLine
                          data={combinedStatsChartData}
                          dataKey="avg_memory_used"
                          DateTimeFormat={selectedInterval.format}
                          isFullHeight
                          showYAxis
                          YAxisProps={{
                            width: 64,
                            tickFormatter: (value: number) => `${Number(value).toFixed(1)}MB`,
                          }}
                        />
                      </div>
                    </ChartContent>
                  </ChartCard>
                </Chart>

                <Chart isLoading={combinedStatsResults.isLoading}>
                  <ChartCard>
                    <ChartHeader align="start">
                      <div className="flex flex-wrap gap-x-8 gap-y-4">
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
                      isEmpty={isErrorCombinedStats || memoryByTypeChartData.length === 0}
                      emptyState={renderChartEmptyState(
                        isErrorCombinedStats ? 'Unable to load memory by type' : 'No data to show',
                        isErrorCombinedStats
                          ? combinedStatsError?.message ?? 'Unknown error'
                          : undefined
                      )}
                      loadingState={<ChartLoadingState />}
                    >
                      <div className="h-40">
                        <ChartLine
                          data={memoryByTypeChartData}
                          dataKey="heap"
                          dataKeys={['heap', 'external']}
                          DateTimeFormat={selectedInterval.format}
                          isFullHeight
                          showYAxis
                          YAxisProps={{
                            width: 64,
                            tickFormatter: (value: number) => `${Number(value).toFixed(1)}MB`,
                          }}
                          config={{
                            heap: { label: 'Heap', color: 'hsl(var(--brand-default))' },
                            external: {
                              label: 'External',
                              color: 'hsl(var(--warning-default))',
                            },
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
    </>
  )
}

PageLayout.getLayout = (page) => (
  <DefaultLayout>
    <EdgeFunctionDetailsLayout title="Overview">{page}</EdgeFunctionDetailsLayout>
  </DefaultLayout>
)

export default PageLayout
