import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { BarChart2Icon } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from 'ui'
import {
  Chart,
  ChartCard,
  ChartContent,
  ChartEmptyState,
  ChartHeader,
  ChartLoadingState,
  ChartMetric,
  ChartTitle,
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
  formatGbHours,
  formatVcpuHours,
  sumBy,
} from '../ComputeUsage.utils'
import { computeInstanceUsageQueryOptions } from '@/data/compute/compute-usage-query'

const USAGE_WINDOW_DAYS = 30

const activeHoursConfig = {
  activeHours: { label: 'Active hours' },
} satisfies ChartConfig

const instancesConfig = {
  instances: { label: 'Instances' },
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

  const totalActiveHours = sumBy(points, (point) => point.activeHours)
  const totalVcpuHours = sumBy(points, (point) => point.vcpuHours)
  const totalGbHours = sumBy(points, (point) => point.gbHours)
  const totalRequests = sumBy(points, (point) => point.requests)

  const chartData = points.map((point) => ({
    timestamp: point.timestamp,
    activeHours: point.activeHours,
    instances: point.instances,
  }))

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Usage</PageSectionTitle>
          <PageSectionDescription>
            What this compute's instances consumed over the last {USAGE_WINDOW_DAYS} days. Figures
            are estimates while Compute is in alpha.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <div className="space-y-4">
          <Chart isLoading={isPending}>
            <div className="grid grid-cols-2 divide-x divide-y rounded-md border border-default bg-surface-100 sm:grid-cols-4 sm:divide-y-0">
              <div className="px-5 py-4">
                <ChartMetric
                  label="Active hours"
                  value={formatComputeHours(totalActiveHours)}
                  tooltip="Hours this compute's instances spent serving traffic rather than suspended."
                />
              </div>
              <div className="px-5 py-4">
                <ChartMetric
                  label="vCPU-hours"
                  value={formatVcpuHours(totalVcpuHours)}
                  tooltip="Active hours multiplied by the vCPU each instance size reserves."
                />
              </div>
              <div className="px-5 py-4">
                <ChartMetric
                  label="GB-hours"
                  value={formatGbHours(totalGbHours)}
                  tooltip="Active hours multiplied by the memory each instance size reserves."
                />
              </div>
              <div className="px-5 py-4">
                <ChartMetric
                  label="Requests"
                  value={formatComputeRequests(totalRequests)}
                  tooltip="Requests handled across every instance of this compute."
                />
              </div>
            </div>
          </Chart>

          {/* Active hours and instance counts are different measures, so they get a chart each
              rather than sharing one y-axis. Both use the neutral ink the other usage
              charts use — nothing here is a status, so nothing is coloured. */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Chart isLoading={isPending} isErrored={isError}>
              <ChartCard>
                <ChartHeader align="start">
                  <ChartTitle tooltip="Hours instances spent serving traffic each day.">
                    Active hours
                  </ChartTitle>
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
                  <ChartContainer config={activeHoursConfig} className="h-44 w-full">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        className="stroke-border-stronger"
                      />
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
                      <Bar dataKey="activeHours" className="fill-foreground" />
                    </BarChart>
                  </ChartContainer>
                </ChartContent>
              </ChartCard>
            </Chart>

            <Chart isLoading={isPending} isErrored={isError}>
              <ChartCard>
                <ChartHeader align="start">
                  <ChartTitle tooltip="Mean number of this compute's instances live each day.">
                    Instances
                  </ChartTitle>
                </ChartHeader>
                <ChartContent
                  isEmpty={isEmpty}
                  loadingState={<ChartLoadingState />}
                  errorState={
                    <ChartEmptyState
                      icon={<BarChart2Icon size={16} />}
                      title="Usage unavailable"
                      description="Unable to load instance counts"
                    />
                  }
                  emptyState={
                    <ChartEmptyState
                      icon={<BarChart2Icon size={16} />}
                      title="No instances yet"
                      description="Instance counts appear once the deployment is live"
                    />
                  }
                >
                  <ChartContainer config={instancesConfig} className="h-44 w-full">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        className="stroke-border-stronger"
                      />
                      <XAxis
                        dataKey="timestamp"
                        tickLine={false}
                        axisLine={false}
                        minTickGap={32}
                        tickFormatter={(value) => dayjs(value).format('DD MMM')}
                        className="text-xs"
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={40}
                        className="text-xs"
                        allowDecimals={false}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            labelFormatter={(value) => dayjs(value).format('DD MMM YYYY')}
                          />
                        }
                      />
                      <Bar dataKey="instances" className="fill-foreground" />
                    </BarChart>
                  </ChartContainer>
                </ChartContent>
              </ChartCard>
            </Chart>
          </div>
        </div>
      </PageSectionContent>
    </PageSection>
  )
}
