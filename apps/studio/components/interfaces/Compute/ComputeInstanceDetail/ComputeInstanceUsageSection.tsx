import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { BarChart2Icon } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from 'ui'
import {
  Chart,
  ChartCard,
  ChartContent,
  ChartEmptyState,
  ChartHeader,
  ChartLoadingState,
  ChartMetric,
  type ChartConfig,
} from 'ui-patterns/Chart'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import type { ComputeInstance } from '../Compute.types'
import {
  formatComputeHours,
  formatComputeRequests,
  formatComputeUnits,
  sumBy,
} from '../ComputeUsage.utils'
import { computeInstanceUsageQueryOptions } from '@/data/compute/compute-usage-query'

const USAGE_WINDOW_DAYS = 30

const chartConfig = {
  computeUnits: { label: 'Compute units', color: 'var(--chart-1)' },
  instances: { label: 'Instances', color: 'var(--chart-2)' },
} satisfies ChartConfig

interface ComputeInstanceUsageSectionProps {
  instance: ComputeInstance
}

export const ComputeInstanceUsageSection = ({ instance }: ComputeInstanceUsageSectionProps) => {
  const { ref: projectRef } = useParams()

  const { data, isPending, isError } = useQuery(
    computeInstanceUsageQueryOptions({
      projectRef,
      name: instance.name,
      size: instance.size,
      instances: instance.declaredInstances,
      days: USAGE_WINDOW_DAYS,
    })
  )

  const points = data?.points ?? []
  const isEmpty = !isPending && points.length === 0

  const totalComputeUnits = sumBy(points, (point) => point.computeUnits)
  const totalActiveHours = sumBy(points, (point) => point.activeHours)
  const totalRequests = sumBy(points, (point) => point.requests)
  const peakInstances = points.length === 0 ? 0 : Math.max(...points.map((p) => p.instances))

  const chartData = points.map((point) => ({
    timestamp: point.timestamp,
    computeUnits: point.computeUnits,
    instances: point.instances,
  }))

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Usage</PageSectionTitle>
          <PageSectionDescription>
            Compute units and instances over the last {USAGE_WINDOW_DAYS} days. Figures are
            estimates while Compute is in alpha.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <div className="space-y-4">
          <Chart isLoading={isPending}>
            <div className="grid grid-cols-2 divide-x divide-y rounded-md border border-default bg-surface-100 sm:grid-cols-4 sm:divide-y-0">
              <div className="px-5 py-4">
                <ChartMetric
                  label="Compute units"
                  value={formatComputeUnits(totalComputeUnits)}
                  tooltip="Active hours weighted by instance size. A 4 GB instance counts twice a 2 GB one."
                />
              </div>
              <div className="px-5 py-4">
                <ChartMetric
                  label="Active hours"
                  value={formatComputeHours(totalActiveHours)}
                  tooltip="Hours instances spent serving traffic rather than suspended."
                />
              </div>
              <div className="px-5 py-4">
                <ChartMetric
                  label="Requests"
                  value={formatComputeRequests(totalRequests)}
                  tooltip="Requests handled across every instance of this deployment."
                />
              </div>
              <div className="px-5 py-4">
                <ChartMetric
                  label="Peak instances"
                  value={peakInstances.toFixed(peakInstances < 10 ? 1 : 0)}
                  tooltip="Highest number of instances live at once during the period."
                />
              </div>
            </div>
          </Chart>

          <Chart isLoading={isPending} isErrored={isError}>
            <ChartCard>
              <ChartHeader align="start">
                <ChartMetric
                  label="Compute units"
                  value={formatComputeUnits(totalComputeUnits)}
                  tooltip="Daily compute units, with live instances plotted alongside."
                />
              </ChartHeader>
              <ChartContent
                isEmpty={isEmpty}
                loadingState={<ChartLoadingState />}
                errorState={
                  <ChartEmptyState
                    icon={<BarChart2Icon size={16} />}
                    title="Usage unavailable"
                    description="Unable to load usage for this instance"
                  />
                }
                emptyState={
                  <ChartEmptyState
                    icon={<BarChart2Icon size={16} />}
                    title="No usage yet"
                    description="Usage appears once the instance starts serving requests"
                  />
                }
              >
                <ChartContainer config={chartConfig} className="h-52 w-full">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--chart-muted)" />
                    <XAxis
                      dataKey="timestamp"
                      tickLine={false}
                      axisLine={false}
                      minTickGap={32}
                      tickFormatter={(value) => dayjs(value).format('DD MMM')}
                      className="text-xs"
                    />
                    <YAxis tickLine={false} axisLine={false} width={40} className="text-xs" />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => dayjs(value).format('DD MMM YYYY')}
                        />
                      }
                    />
                    <Area
                      dataKey="computeUnits"
                      type="monotone"
                      stroke="var(--chart-1)"
                      fill="var(--chart-1-fill)"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Area
                      dataKey="instances"
                      type="monotone"
                      stroke="var(--chart-2)"
                      fill="var(--chart-2-fill)"
                      fillOpacity={0.12}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </ChartContent>
            </ChartCard>
          </Chart>
        </div>
      </PageSectionContent>
    </PageSection>
  )
}
