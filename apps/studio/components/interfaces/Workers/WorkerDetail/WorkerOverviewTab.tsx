import { BarChart2, Check, ExternalLink } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import {
  Chart,
  ChartCard,
  ChartContent,
  ChartEmptyState,
  ChartHeader,
  ChartLine,
  ChartLoadingState,
  ChartMetric,
} from 'ui-patterns/Chart'
import { LogsBarChart } from 'ui-patterns/LogsBarChart'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { WorkerCommandLine } from '../WorkerCommandLine'
import { WORKER_ERROR_REASON_LABEL } from '../Workers.constants'
import type { Worker } from '../Workers.types'
import {
  buildWorkerChartData,
  CHART_INTERVALS,
  CPU_TIME_CHART_CONFIG,
  formatMetric,
  formatRate,
  getSegmentedButtonClassName,
  meanBy,
  MEMORY_CHART_CONFIG,
  RESPONSE_TIME_CHART_CONFIG,
  sumBy,
} from './workerCharts'
import { CLI_NAME } from '@/lib/constants/workers'

interface WorkerOverviewTabProps {
  projectRef: string
  worker: Worker
}

const WorkerChartEmpty = () => (
  <ChartEmptyState
    icon={<BarChart2 size={16} />}
    title="No data to show"
    description="It may take up to 24 hours for data to refresh"
  />
)

export const WorkerOverviewTab = ({ projectRef, worker }: WorkerOverviewTabProps) => {
  const [interval, setInterval] = useState<string>('1hr')
  const selectedInterval =
    CHART_INTERVALS.find((item) => item.key === interval) ?? CHART_INTERVALS[1]
  const dateTimeFormat = selectedInterval.format

  const { invocation, metrics } = useMemo(
    () => buildWorkerChartData(worker, interval),
    [worker, interval]
  )

  const { totalRequests, totalErrors, totalWarnings } = useMemo(
    () => ({
      totalRequests: sumBy(invocation, (d) => d.ok_count + d.warning_count + d.error_count),
      totalErrors: sumBy(invocation, (d) => d.error_count),
      totalWarnings: sumBy(invocation, (d) => d.warning_count),
    }),
    [invocation]
  )

  const { averageResponseTime, maxResponseTime } = useMemo(
    () => ({
      averageResponseTime: meanBy(metrics, (d) => d.avg_response_time),
      maxResponseTime:
        metrics.length === 0 ? 0 : Math.max(...metrics.map((d) => d.max_response_time)),
    }),
    [metrics]
  )

  const { averageCpuTime, maxCpuTime, averageMemory, peakMemoryPercent } = useMemo(
    () => ({
      averageCpuTime: meanBy(metrics, (d) => d.avg_cpu_time_used),
      maxCpuTime: metrics.length === 0 ? 0 : Math.max(...metrics.map((d) => d.max_cpu_time_used)),
      averageMemory: meanBy(metrics, (d) => d.avg_memory_used),
      peakMemoryPercent:
        metrics.length === 0 ? 0 : Math.max(...metrics.map((d) => d.memory_percent)),
    }),
    [metrics]
  )

  const isErrored = worker.state === 'errored'
  const hasNoData = invocation.length === 0

  return (
    <>
      {/* Metrics breakdown band */}
      <PageSection className="border-b bg-surface-100/50 pb-8 pt-0">
        <PageContainer size="full">
          <div className="flex flex-col gap-5">
            <PageSectionMeta className="items-center! pt-8">
              <PageSectionSummary>
                <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
                  <ChartMetric
                    label="Total Requests"
                    value={totalRequests}
                    status="default"
                    tooltip="Total number of requests to this worker"
                  />
                  <ChartMetric
                    label="5xx Rate"
                    value={formatRate(totalErrors, totalRequests)}
                    status="negative"
                    tooltip="Share of requests that returned a 5xx status code"
                  />
                  <ChartMetric
                    label="4xx Rate"
                    value={formatRate(totalWarnings, totalRequests)}
                    status="warning"
                    tooltip="Share of requests that returned a 4xx status code"
                  />
                </div>
              </PageSectionSummary>
              <PageSectionAside className="flex-wrap @xl:self-center">
                <div className="flex items-center">
                  {CHART_INTERVALS.map((item, index) => (
                    <Button
                      key={item.key}
                      variant={interval === item.key ? 'secondary' : 'default'}
                      onClick={() => setInterval(item.key)}
                      className={getSegmentedButtonClassName(index, CHART_INTERVALS.length)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </PageSectionAside>
            </PageSectionMeta>
            <Chart>
              <div className="h-40">
                <LogsBarChart
                  data={invocation}
                  DateTimeFormat={dateTimeFormat}
                  isFullHeight
                  EmptyState={<WorkerChartEmpty />}
                />
              </div>
            </Chart>
          </div>
        </PageContainer>
      </PageSection>

      <PageContainer size="full">
        {/* Errors */}
        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Errors in the last 24h</PageSectionTitle>
            </PageSectionSummary>
            <PageSectionAside>
              <Button variant="default" size="tiny" icon={<ExternalLink size={14} />} asChild>
                <a href={`/project/${projectRef}/workers/${worker.name}?tab=logs`}>View logs</a>
              </Button>
            </PageSectionAside>
          </PageSectionMeta>
          <PageSectionContent>
            {isErrored ? (
              <Admonition
                type="destructive"
                title="This worker errored"
                description={
                  <div className="space-y-3">
                    <p>
                      {worker.errorReason
                        ? WORKER_ERROR_REASON_LABEL[worker.errorReason]
                        : 'The worker stopped unexpectedly.'}
                    </p>
                    <WorkerCommandLine
                      comment="Redeploy after fixing the build"
                      command={`supabase ${CLI_NAME} push ${worker.name}`}
                    />
                  </div>
                }
              />
            ) : (
              <div className="rounded-md border border-dashed px-5 py-6 text-sm text-foreground-light">
                <div className="flex items-start gap-3">
                  <Check size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-brand" />
                  <div>
                    There have been{' '}
                    <span className="text-foreground">
                      {totalRequests.toLocaleString('en-US')} requests
                    </span>{' '}
                    since last deploy and no errors.
                  </div>
                </div>
              </div>
            )}
          </PageSectionContent>
        </PageSection>

        {/* Performance */}
        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Performance</PageSectionTitle>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <Chart>
              <ChartCard>
                <ChartHeader align="start">
                  <div className="flex flex-wrap gap-x-8 gap-y-4">
                    <ChartMetric
                      label="Average Response Time"
                      value={formatMetric(averageResponseTime, 'ms')}
                      tooltip="Average response time across requests"
                    />
                    <ChartMetric
                      label="Max Response Time"
                      value={formatMetric(maxResponseTime, 'ms')}
                      tooltip="Slowest response time across requests"
                    />
                  </div>
                </ChartHeader>
                <ChartContent
                  isEmpty={hasNoData}
                  emptyState={<WorkerChartEmpty />}
                  loadingState={<ChartLoadingState />}
                >
                  <div className="h-40">
                    <ChartLine
                      data={metrics}
                      dataKey="max_response_time"
                      dataKeys={['avg_response_time', 'max_response_time']}
                      DateTimeFormat={dateTimeFormat}
                      config={RESPONSE_TIME_CHART_CONFIG}
                      isFullHeight
                      showYAxis
                      referenceLines={[
                        {
                          y: averageResponseTime,
                          label: 'average',
                          stroke: 'var(--foreground-default)',
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
          </PageSectionContent>
        </PageSection>

        {/* Usage */}
        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Usage</PageSectionTitle>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <div className="flex flex-col gap-6">
              <Chart>
                <ChartCard>
                  <ChartHeader align="start">
                    <div className="flex flex-wrap gap-x-8 gap-y-4">
                      <ChartMetric
                        label="Average CPU Time"
                        value={formatMetric(averageCpuTime, 'ms')}
                        tooltip="Average CPU time per request"
                      />
                      <ChartMetric
                        label="Max CPU Time"
                        value={formatMetric(maxCpuTime, 'ms')}
                        tooltip="Peak CPU time per request"
                      />
                    </div>
                  </ChartHeader>
                  <ChartContent
                    isEmpty={hasNoData}
                    emptyState={<WorkerChartEmpty />}
                    loadingState={<ChartLoadingState />}
                  >
                    <div className="h-40">
                      <ChartLine
                        data={metrics}
                        dataKey="max_cpu_time_used"
                        DateTimeFormat={dateTimeFormat}
                        config={CPU_TIME_CHART_CONFIG}
                        isFullHeight
                        showYAxis
                        referenceLines={[
                          {
                            y: averageCpuTime,
                            label: 'average',
                            stroke: 'var(--foreground-default)',
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

              <Chart>
                <ChartCard>
                  <ChartHeader align="start">
                    <div className="flex flex-wrap gap-x-8 gap-y-4">
                      <ChartMetric
                        label="Average Memory Usage"
                        value={formatMetric(averageMemory, 'MB')}
                        tooltip="Average memory used by the worker"
                      />
                      <ChartMetric
                        label="Peak Memory"
                        value={formatRate(peakMemoryPercent, 1)}
                        tooltip="Peak memory as a share of the allocated memory"
                      />
                    </div>
                  </ChartHeader>
                  <ChartContent
                    isEmpty={hasNoData}
                    emptyState={<WorkerChartEmpty />}
                    loadingState={<ChartLoadingState />}
                  >
                    <div className="h-40">
                      <ChartLine
                        data={metrics}
                        dataKey="avg_memory_used"
                        DateTimeFormat={dateTimeFormat}
                        config={MEMORY_CHART_CONFIG}
                        isFullHeight
                        showYAxis
                        referenceLines={[
                          {
                            y: averageMemory,
                            label: 'average',
                            stroke: 'var(--foreground-default)',
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
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}
