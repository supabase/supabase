import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { BarChart2Icon } from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, cn } from 'ui'
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

import { SectionContent } from './SectionContent'
import { formatSize } from '@/components/interfaces/Compute/Compute.utils'
import {
  COMPUTE_ALLOWANCE_WARNING_THRESHOLD,
  getComputeActiveHoursAllowance,
} from '@/components/interfaces/Compute/ComputeUsage.constants'
import {
  aggregateUsageBySize,
  buildComputeBurndown,
  formatComputeHours,
  formatComputeRequests,
  formatComputeUnits,
  getUsageConcentration,
  sumBy,
} from '@/components/interfaces/Compute/ComputeUsage.utils'
import { computeOrgUsageQueryOptions } from '@/data/compute/compute-usage-query'
import type { OrgSubscription } from '@/data/subscriptions/types'

const USAGE_WINDOW_DAYS = 30

const burndownConfig = {
  usedHours: { label: 'Active hours used', color: 'var(--chart-1)' },
} satisfies ChartConfig

const bySizeConfig = {
  activeHours: { label: 'Active hours', color: 'var(--chart-1)' },
  computeUnits: { label: 'Compute units', color: 'var(--chart-2)' },
} satisfies ChartConfig

export interface ComputeServicesProps {
  orgSlug: string
  projectRef?: string | null
  subscription: OrgSubscription | undefined
}

export const ComputeServices = ({ orgSlug, projectRef, subscription }: ComputeServicesProps) => {
  const { data, isPending, isError } = useQuery(
    computeOrgUsageQueryOptions({ orgSlug, projectRef, days: USAGE_WINDOW_DAYS })
  )

  const allowanceHours = getComputeActiveHoursAllowance(subscription?.plan.id)
  const points = data?.points ?? []
  const byProject = data?.byProject ?? []
  const bySize = aggregateUsageBySize(data?.instanceRows ?? [])
  const burndown = buildComputeBurndown(points, allowanceHours, COMPUTE_ALLOWANCE_WARNING_THRESHOLD)

  const isEmpty = !isPending && points.length === 0
  const totalComputeUnits = sumBy(points, (point) => point.computeUnits)
  const totalRequests = sumBy(points, (point) => point.requests)
  const concentration = getUsageConcentration(byProject)

  const burndownStatus =
    burndown.status === 'exhausted'
      ? ('negative' as const)
      : burndown.status === 'warning'
        ? ('warning' as const)
        : ('default' as const)

  return (
    <div id="compute-services" className="scroll-my-12">
      <SectionContent
        section={{
          name: 'Compute',
          description:
            'Usage for Compute instances across the organization. Active hours count the time instances spend serving traffic; suspended instances do not accrue usage.\nCompute is in alpha and these figures are estimates. Nothing here is billed yet.',
          links: [],
        }}
      >
        <div className="space-y-6">
          {/* Active hours burn-down, with the plan allowance and its warning threshold */}
          <Chart isLoading={isPending} isErrored={isError}>
            <ChartCard>
              <ChartHeader align="start">
                <div className="flex flex-col gap-1">
                  <ChartTitle tooltip="Active hours consumed so far this period, against the plan allowance.">
                    Active hours
                  </ChartTitle>
                  <p className="text-sm text-foreground-light">
                    {burndown.allowanceHours === null
                      ? `${formatComputeHours(burndown.usedHours)} used · no fixed allowance on this plan`
                      : `${formatComputeHours(burndown.usedHours)} of ${formatComputeHours(burndown.allowanceHours)} used`}
                  </p>
                </div>
                <ChartMetric
                  align="end"
                  label="Remaining"
                  status={burndownStatus}
                  value={
                    burndown.remainingHours === null
                      ? 'No limit'
                      : formatComputeHours(burndown.remainingHours)
                  }
                />
              </ChartHeader>
              <ChartContent
                isEmpty={isEmpty}
                loadingState={<ChartLoadingState />}
                errorState={
                  <ChartEmptyState
                    icon={<BarChart2Icon size={16} />}
                    title="Usage unavailable"
                    description="Unable to load Compute usage for this organization"
                  />
                }
                emptyState={
                  <ChartEmptyState
                    icon={<BarChart2Icon size={16} />}
                    title="No Compute usage yet"
                    description="Deploy an instance to start tracking active hours"
                  />
                }
              >
                <ChartContainer config={burndownConfig} className="h-56 w-full">
                  <AreaChart
                    data={burndown.points}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid vertical={false} stroke="var(--chart-muted)" />
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
                      width={48}
                      className="text-xs"
                      domain={[
                        0,
                        (dataMax: number) =>
                          Math.ceil(Math.max(dataMax, burndown.allowanceHours ?? 0) * 1.1),
                      ]}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => dayjs(value).format('DD MMM YYYY')}
                        />
                      }
                    />
                    {burndown.warningHours !== null && (
                      <ReferenceLine
                        y={burndown.warningHours}
                        stroke="var(--chart-status-warning)"
                        strokeDasharray="4 4"
                        label={{
                          value: `80% · ${formatComputeHours(burndown.warningHours)}`,
                          position: 'insideTopLeft',
                          className: 'text-xs fill-warning',
                        }}
                      />
                    )}
                    {burndown.allowanceHours !== null && (
                      <ReferenceLine
                        y={burndown.allowanceHours}
                        stroke="var(--chart-reference)"
                        label={{
                          value: `Limit · ${formatComputeHours(burndown.allowanceHours)}`,
                          position: 'insideTopLeft',
                          className: 'text-xs fill-foreground-light',
                        }}
                      />
                    )}
                    <Area
                      dataKey="usedHours"
                      type="monotone"
                      stroke="var(--chart-1)"
                      fill="var(--chart-1-fill)"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </ChartContent>
            </ChartCard>
          </Chart>

          {/* Instance-hours by size */}
          <Chart isLoading={isPending} isErrored={isError}>
            <ChartCard>
              <ChartHeader align="start">
                <div className="flex flex-col gap-1">
                  <ChartTitle tooltip="Active hours split by instance size, and the compute units they weigh.">
                    Instance hours by size
                  </ChartTitle>
                  <p className="text-sm text-foreground-light">
                    {formatComputeUnits(totalComputeUnits)} compute units this period
                  </p>
                </div>
              </ChartHeader>
              <ChartContent
                isEmpty={!isPending && bySize.length === 0}
                loadingState={<ChartLoadingState />}
                errorState={
                  <ChartEmptyState
                    icon={<BarChart2Icon size={16} />}
                    title="Usage unavailable"
                    description="Unable to load instance hours"
                  />
                }
                emptyState={
                  <ChartEmptyState
                    icon={<BarChart2Icon size={16} />}
                    title="No instance hours yet"
                    description="Deploy an instance to see usage by size"
                  />
                }
              >
                <ChartContainer config={bySizeConfig} className="h-44 w-full">
                  <BarChart
                    data={bySize.map((entry) => ({ ...entry, label: formatSize(entry.size) }))}
                    layout="vertical"
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid horizontal={false} stroke="var(--chart-muted)" />
                    <XAxis type="number" tickLine={false} axisLine={false} className="text-xs" />
                    <YAxis
                      type="category"
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      width={110}
                      className="text-xs"
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="activeHours" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="computeUnits" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </ChartContent>
            </ChartCard>
          </Chart>

          {/* Per-project breakdown */}
          <Chart isLoading={isPending} isErrored={isError}>
            <ChartCard>
              <ChartHeader align="start">
                <div className="flex flex-col gap-1">
                  <ChartTitle tooltip="Compute usage attributed to each project in the organization.">
                    Usage by project
                  </ChartTitle>
                  <p className="text-sm text-foreground-light">
                    {formatComputeRequests(totalRequests)} requests ·{' '}
                    {Math.round(concentration * 100)}% from the largest project
                  </p>
                </div>
              </ChartHeader>
              <ChartContent
                className="p-0"
                isEmpty={!isPending && byProject.length === 0}
                loadingState={<ChartLoadingState className="m-card" />}
                errorState={
                  <ChartEmptyState
                    className="m-card"
                    icon={<BarChart2Icon size={16} />}
                    title="Usage unavailable"
                    description="Unable to load usage by project"
                  />
                }
                emptyState={
                  <ChartEmptyState
                    className="m-card"
                    icon={<BarChart2Icon size={16} />}
                    title="No projects using Compute"
                    description="Deploy an instance to see it listed here"
                  />
                }
              >
                <ComputeProjectTable rows={byProject} totalComputeUnits={totalComputeUnits} />
              </ChartContent>
            </ChartCard>
          </Chart>
        </div>
      </SectionContent>
    </div>
  )
}

const ComputeProjectTable = ({
  rows,
  totalComputeUnits,
}: {
  rows: {
    projectRef: string
    projectName: string
    activeHours: number
    computeUnits: number
    instances: number
    requests: number
  }[]
  totalComputeUnits: number
}) => (
  <div className="divide-y">
    <div className="grid grid-cols-12 gap-2 px-card py-2 text-xs font-mono uppercase text-foreground-lighter">
      <span className="col-span-4">Project</span>
      <span className="col-span-2 text-right">Instances</span>
      <span className="col-span-2 text-right">Active hours</span>
      <span className="col-span-2 text-right">Requests</span>
      <span className="col-span-2 text-right">Share</span>
    </div>
    {rows.map((row) => {
      const share = totalComputeUnits <= 0 ? 0 : row.computeUnits / totalComputeUnits
      return (
        <div key={row.projectRef} className="grid grid-cols-12 items-center gap-2 px-card py-2.5">
          <span className="col-span-4 truncate text-sm text-foreground">{row.projectName}</span>
          <span className="col-span-2 text-right text-sm tabular-nums text-foreground-light">
            {row.instances}
          </span>
          <span className="col-span-2 text-right text-sm tabular-nums text-foreground-light">
            {formatComputeHours(row.activeHours)}
          </span>
          <span className="col-span-2 text-right text-sm tabular-nums text-foreground-light">
            {formatComputeRequests(row.requests)}
          </span>
          <span className="col-span-2 flex items-center justify-end gap-2">
            <span
              aria-hidden
              className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-surface-300 sm:block"
            >
              <span
                className={cn('block h-full rounded-full bg-brand-default')}
                style={{ width: `${Math.round(share * 100)}%` }}
              />
            </span>
            <span className="text-sm tabular-nums text-foreground-light">
              {Math.round(share * 100)}%
            </span>
          </span>
        </div>
      )
    })}
  </div>
)
