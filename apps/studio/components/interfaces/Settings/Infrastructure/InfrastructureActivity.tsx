import { useParams } from 'common'
import dayjs from 'dayjs'
import Link from 'next/link'
import { Fragment, useMemo, useState } from 'react'
import { IconBarChart2, IconExternalLink } from 'ui'

import { getAddons } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import {
  CPUWarnings,
  DiskIOBandwidthWarnings,
  RAMWarnings,
} from 'components/interfaces/Billing/Usage/UsageWarningAlerts'
import UsageBarChart from 'components/interfaces/Organization/Usage/UsageBarChart'
import {
  ScaffoldContainer,
  ScaffoldDivider,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import DateRangePicker from 'components/to-be-cleaned/DateRangePicker'
import Panel from 'components/ui/Panel'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { DataPoint } from 'data/analytics/constants'
import { useInfraMonitoringQuery } from 'data/analytics/infra-monitoring-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import { useFlag, useSelectedOrganization } from 'hooks'
import { TIME_PERIODS_BILLING, TIME_PERIODS_REPORTS } from 'lib/constants'
import { INFRA_ACTIVITY_METRICS } from './Infrastructure.constants'
import DatabaseSelector from 'components/ui/DatabaseSelector'

const InfrastructureActivity = () => {
  const { ref: projectRef } = useParams()
  const organization = useSelectedOrganization()
  const [dateRange, setDateRange] = useState<any>()
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>('1')

  const readReplicasEnabled = useFlag('readReplicas')

  const { data: subscription, isLoading: isLoadingSubscription } = useOrgSubscriptionQuery({
    orgSlug: organization?.slug,
  })
  const isFreePlan = subscription?.plan?.id === 'free'

  const { data: resourceWarnings } = useResourceWarningsQuery()
  const projectResourceWarnings = resourceWarnings?.find((x) => x.project === projectRef)

  const { data: addons, isLoading } = useProjectAddonsQuery({ projectRef })
  const selectedAddons = addons?.selected_addons ?? []

  const { computeInstance } = getAddons(selectedAddons)
  const currentComputeInstanceSpecs = computeInstance?.variant?.meta ?? {
    baseline_disk_io_mbs: 87,
    max_disk_io_mbs: 2085,
    cpu_cores: 2,
    cpu_dedicated: true,
    memory_gb: 1,
  }

  const currentBillingCycleSelected = useMemo(() => {
    // Selected by default
    if (!dateRange?.period_start || !dateRange?.period_end || !subscription) return true

    const { current_period_start, current_period_end } = subscription

    return (
      dayjs(dateRange.period_start.date).isSame(new Date(current_period_start * 1000)) &&
      dayjs(dateRange.period_end.date).isSame(new Date(current_period_end * 1000))
    )
  }, [dateRange, subscription])

  const upgradeUrl =
    subscription === undefined
      ? `/`
      : subscription.plan.id === 'free'
      ? `/org/${organization?.slug ?? '[slug]'}/billing#subscription`
      : `/project/${projectRef}/settings/addons`

  const categoryMeta = INFRA_ACTIVITY_METRICS.find((category) => category.key === 'infra')

  const startDate = useMemo(() => {
    if (dateRange?.period_start?.date === 'Invalid Date') return undefined

    // If end date is in future, set end date to now
    if (!dateRange?.period_start?.date) {
      return undefined
    } else {
      // LF seems to have an issue with the milliseconds, causes infinite loading sometimes
      return new Date(dateRange?.period_start?.date ?? 0).toISOString().slice(0, -5) + 'Z'
    }
  }, [dateRange, subscription])

  const endDate = useMemo(() => {
    if (dateRange?.period_end?.date === 'Invalid Date') return undefined

    // If end date is in future, set end date to end of current day
    if (dateRange?.period_end?.date && dayjs(dateRange.period_end.date).isAfter(dayjs())) {
      // LF seems to have an issue with the milliseconds, causes infinite loading sometimes
      // In order to have full days from Prometheus metrics when using 1d interval,
      // the time needs to be greater or equal than the time of the start date
      return dayjs().endOf('day').toISOString().slice(0, -5) + 'Z'
    } else if (dateRange?.period_end?.date) {
      // LF seems to have an issue with the milliseconds, causes infinite loading sometimes
      return new Date(dateRange.period_end.date ?? 0).toISOString().slice(0, -5) + 'Z'
    }
  }, [dateRange, subscription])

  // Switch to hourly interval, if the timeframe is <48 hours
  let interval: '1d' | '1h' = '1d'
  let dateFormat = 'DD MMM'
  if (startDate && endDate) {
    const diffInHours = dayjs(endDate).diff(startDate, 'hours')

    if (diffInHours <= 48) {
      interval = '1h'
      dateFormat = 'h a'
    }
  }

  const { data: cpuUsageData, isLoading: isLoadingCpuUsageData } = useInfraMonitoringQuery({
    projectRef,
    attribute: 'max_cpu_usage',
    interval,
    startDate,
    endDate,
    dateFormat,
  })

  const { data: memoryUsageData, isLoading: isLoadingMemoryUsageData } = useInfraMonitoringQuery({
    projectRef,
    attribute: 'ram_usage',
    interval,
    startDate,
    endDate,
    dateFormat,
  })

  const { data: ioBudgetData, isLoading: isLoadingIoBudgetData } = useInfraMonitoringQuery({
    projectRef,
    attribute: 'disk_io_consumption',
    interval,
    startDate,
    endDate,
    dateFormat,
  })

  const hasLatest = dayjs(endDate!).isAfter(dayjs().startOf('day'))

  const latestIoBudgetConsumption =
    hasLatest && ioBudgetData?.data?.slice(-1)?.[0]
      ? Number(ioBudgetData.data.slice(-1)[0].disk_io_consumption)
      : 0

  const highestIoBudgetConsumption = Math.max(
    ...(ioBudgetData?.data || []).map((x) => Number(x.disk_io_consumption) ?? 0),
    0
  )

  const chartMeta: { [key: string]: { data: DataPoint[]; isLoading: boolean } } = {
    max_cpu_usage: {
      isLoading: isLoadingCpuUsageData,
      data: cpuUsageData?.data ?? [],
    },
    ram_usage: {
      isLoading: isLoadingMemoryUsageData,
      data: memoryUsageData?.data ?? [],
    },
    disk_io_consumption: {
      isLoading: isLoadingIoBudgetData,
      data: ioBudgetData?.data ?? [],
    },
  }

  return (
    <>
      <ScaffoldContainer>
        <div className="mx-auto flex flex-col gap-10 pt-6">
          <div>
            <p className="text-xl">Infrastructure Activity</p>
            <p className="text-sm text-foreground-light">
              Activity statistics related to your server instance
            </p>
          </div>
        </div>
      </ScaffoldContainer>
      <ScaffoldContainer className="sticky top-0 py-6 border-b bg-background z-10">
        <div className="flex items-center gap-x-4">
          {readReplicasEnabled && (
            <DatabaseSelector
              selectedDatabaseId={selectedDatabaseId}
              onChangeDatabaseId={setSelectedDatabaseId}
            />
          )}
          {!isLoadingSubscription && (
            <>
              <DateRangePicker
                onChange={setDateRange}
                value={TIME_PERIODS_REPORTS[0].key}
                options={[...TIME_PERIODS_BILLING, ...TIME_PERIODS_REPORTS]}
                loading={isLoadingSubscription}
                currentBillingPeriodStart={subscription?.current_period_start}
                currentBillingPeriodEnd={subscription?.current_period_end}
              />
              <p className="text-sm text-foreground-light">
                {dayjs(startDate).format('DD MMM YYYY')} - {dayjs(endDate).format('DD MMM YYYY')}
              </p>
            </>
          )}
        </div>
      </ScaffoldContainer>

      {categoryMeta?.attributes.map((attribute) => {
        const chartData = chartMeta[attribute.key]?.data ?? []

        return (
          <Fragment key={attribute.key}>
            <ScaffoldContainer id={attribute.anchor}>
              <ScaffoldSection>
                <ScaffoldSectionDetail>
                  <div className="sticky top-32 space-y-6">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-base capitalize m-0">{attribute.name}</h4>
                      </div>
                      <div className="grid gap-4">
                        {attribute.description.split('\n').map((value, idx) => (
                          <p key={`desc-${idx}`} className="text-sm text-foreground-light pr-8 m-0">
                            {value}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-foreground mb-2">More information</p>
                      {attribute.links.map((link) => (
                        <div key={link.url}>
                          <Link href={link.url} target="_blank" rel="noreferrer">
                            <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                              <p className="text-sm m-0">{link.name}</p>
                              <IconExternalLink size={16} strokeWidth={1.5} />
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScaffoldSectionDetail>
                <ScaffoldSectionContent>
                  {attribute.key === 'disk_io_consumption' && (
                    <>
                      <DiskIOBandwidthWarnings
                        upgradeUrl={upgradeUrl}
                        isFreePlan={isFreePlan}
                        hasLatest={hasLatest}
                        currentBillingCycleSelected={currentBillingCycleSelected}
                        latestIoBudgetConsumption={latestIoBudgetConsumption}
                        highestIoBudgetConsumption={highestIoBudgetConsumption}
                      />
                      <div className="space-y-1">
                        <p>Disk IO Bandwidth</p>

                        {currentComputeInstanceSpecs.baseline_disk_io_mbs ===
                        currentComputeInstanceSpecs.max_disk_io_mbs ? (
                          <p className="text-sm text-foreground-light">
                            Your current compute can has a baseline and maximum disk throughput of{' '}
                            {currentComputeInstanceSpecs.max_disk_io_mbs?.toLocaleString()} Mbps.
                          </p>
                        ) : (
                          <p className="text-sm text-foreground-light">
                            Your current compute can burst up to{' '}
                            {currentComputeInstanceSpecs.max_disk_io_mbs?.toLocaleString()} Mbps for
                            30 minutes a day and reverts to the baseline performance of{' '}
                            {currentComputeInstanceSpecs.baseline_disk_io_mbs?.toLocaleString()}{' '}
                            Mbps.
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm mb-2">Overview</p>
                        <div className="flex items-center justify-between border-b py-1">
                          <p className="text-xs text-foreground-light">Current compute instance</p>
                          <p className="text-xs">{computeInstance?.variant?.name ?? 'Micro'}</p>
                        </div>
                        <div className="flex items-center justify-between border-b py-1">
                          <p className="text-xs text-foreground-light">
                            Maximum IO Bandwidth (burst limit)
                          </p>
                          <p className="text-xs">
                            {currentComputeInstanceSpecs.max_disk_io_mbs?.toLocaleString()} Mbps
                          </p>
                        </div>
                        <div className="flex items-center justify-between border-b py-1">
                          <p className="text-xs text-foreground-light">Baseline IO Bandwidth</p>
                          <p className="text-xs">
                            {currentComputeInstanceSpecs.baseline_disk_io_mbs?.toLocaleString()}{' '}
                            Mbps
                          </p>
                        </div>
                        {currentComputeInstanceSpecs.max_disk_io_mbs !==
                          currentComputeInstanceSpecs?.baseline_disk_io_mbs && (
                          <div className="flex items-center justify-between py-1">
                            <p className="text-xs text-foreground-light">Daily burst time limit</p>
                            <p className="text-xs">30 mins</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {attribute.key === 'max_cpu_usage' && (
                    <CPUWarnings
                      isFreePlan={isFreePlan}
                      upgradeUrl={upgradeUrl}
                      severity={projectResourceWarnings?.cpu_exhaustion}
                    />
                  )}
                  {attribute.key === 'ram_usage' && (
                    <RAMWarnings
                      isFreePlan={isFreePlan}
                      upgradeUrl={upgradeUrl}
                      severity={projectResourceWarnings?.memory_and_swap_exhaustion}
                    />
                  )}

                  <div className="space-y-1">
                    <div className="flex flex-row justify-between">
                      {attribute.key === 'disk_io_consumption' ? (
                        <p>Disk IO consumed per {interval === '1d' ? 'day' : 'hour'}</p>
                      ) : (
                        <p>
                          Max{' '}
                          <span className={attribute.key === 'ram_usage' ? 'lowercase' : ''}>
                            {attribute.name}
                          </span>{' '}
                          utilization per {interval === '1d' ? 'day' : 'hour'}
                        </p>
                      )}
                    </div>

                    {attribute.key === 'ram_usage' && (
                      <div className="text-sm text-foreground-light">
                        <p>
                          Your compute instance has {currentComputeInstanceSpecs.memory_gb} GB of
                          memory.
                        </p>
                        {currentComputeInstanceSpecs.memory_gb === 1 && (
                          <p>
                            As your project is running on the smallest compute instance, it is not
                            unusual for your project to have a base memory usage of ~50%.
                          </p>
                        )}
                      </div>
                    )}

                    {attribute.key === 'max_cpu_usage' && (
                      <p className="text-sm text-foreground-light">
                        Your compute instance has {currentComputeInstanceSpecs.cpu_cores} CPU cores.
                      </p>
                    )}

                    {attribute.chartDescription.split('\n').map((paragraph, idx) => (
                      <p key={`para-${idx}`} className="text-sm text-foreground-light">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {chartMeta[attribute.key].isLoading ? (
                    <div className="space-y-2">
                      <ShimmeringLoader />
                      <ShimmeringLoader className="w-3/4" />
                      <ShimmeringLoader className="w-1/2" />
                    </div>
                  ) : chartData.length ? (
                    <UsageBarChart
                      name={`${attribute.chartPrefix || ''}${attribute.name}`}
                      unit={attribute.unit}
                      attributes={attribute.attributes}
                      data={chartData}
                      yFormatter={(value) => `${Math.round(Number(value))}%`}
                      tooltipFormatter={(value) => `${value}%`}
                      yLimit={100}
                    />
                  ) : (
                    <Panel>
                      <Panel.Content>
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <IconBarChart2 className="text-foreground-light mb-2" />
                          <p className="text-sm">No data in period</p>
                          <p className="text-sm text-foreground-light">
                            May take a few minutes to show
                          </p>
                        </div>
                      </Panel.Content>
                    </Panel>
                  )}
                </ScaffoldSectionContent>
              </ScaffoldSection>
            </ScaffoldContainer>
            <ScaffoldDivider />
          </Fragment>
        )
      })}
    </>
  )
}

export default InfrastructureActivity
