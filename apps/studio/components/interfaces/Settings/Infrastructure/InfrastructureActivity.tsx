import { useParams } from 'common'
import { getAddons } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { CPUWarnings } from 'components/interfaces/Billing/Usage/UsageWarningAlerts/CPUWarnings'
import { DiskIOBandwidthWarnings } from 'components/interfaces/Billing/Usage/UsageWarningAlerts/DiskIOBandwidthWarnings'
import { RAMWarnings } from 'components/interfaces/Billing/Usage/UsageWarningAlerts/RAMWarnings'
import UsageBarChart from 'components/interfaces/Organization/Usage/UsageBarChart'
import {
  ScaffoldContainer,
  ScaffoldDivider,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { DatabaseSelector } from 'components/ui/DatabaseSelector'
import { DateRangePicker } from 'components/ui/DateRangePicker'
import { DocsButton } from 'components/ui/DocsButton'
import Panel from 'components/ui/Panel'
import { DataPoint } from 'data/analytics/constants'
import { mapMultiResponseToAnalyticsData } from 'data/analytics/infra-monitoring-queries'
import {
  InfraMonitoringAttribute,
  useInfraMonitoringAttributesQuery,
} from 'data/analytics/infra-monitoring-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import dayjs from 'dayjs'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL, INSTANCE_MICRO_SPECS, INSTANCE_NANO_SPECS, InstanceSpecs } from 'lib/constants'
import { TIME_PERIODS_BILLING, TIME_PERIODS_REPORTS } from 'lib/constants/metrics'
import { capitalize } from 'lodash'
import { BarChart2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Fragment, useMemo, useState } from 'react'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { Admonition } from 'ui-patterns/admonition'

import { INFRA_ACTIVITY_METRICS } from './Infrastructure.constants'

const NON_DEDICATED_IO_RESOURCES = [
  'ci_micro',
  'ci_small',
  'ci_medium',
  'ci_large',
  'ci_xlarge',
  'ci_2xlarge',
]

const INFRA_ATTRIBUTES: InfraMonitoringAttribute[] = [
  'max_cpu_usage',
  'ram_usage',
  'disk_io_consumption',
]

export const InfrastructureActivity = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const state = useDatabaseSelectorStateSnapshot()
  const [dateRange, setDateRange] = useState<any>()

  const { data: subscription, isPending: isLoadingSubscription } = useOrgSubscriptionQuery({
    orgSlug: organization?.slug,
  })
  const isFreePlan = organization?.plan?.id === 'free'

  const { data: resourceWarnings } = useResourceWarningsQuery({ ref: projectRef })
  // [Joshen Cleanup] JFYI this client side filtering can be cleaned up once BE changes are live which will only return the warnings based on the provided ref
  const projectResourceWarnings = resourceWarnings?.find((x) => x.project === projectRef)

  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const selectedAddons = addons?.selected_addons ?? []

  const { computeInstance } = getAddons(selectedAddons)
  const hasDedicatedIOResources =
    computeInstance !== undefined &&
    !NON_DEDICATED_IO_RESOURCES.includes(computeInstance.variant.identifier)

  function getCurrentComputeInstanceSpecs() {
    if (computeInstance?.variant.meta) {
      // If user has a compute instance (called addons) return that
      return computeInstance?.variant.meta as InstanceSpecs
    } else {
      // Otherwise, return the default specs
      return project?.infra_compute_size === 'nano' ? INSTANCE_NANO_SPECS : INSTANCE_MICRO_SPECS
    }
  }

  const currentComputeInstanceSpecs = getCurrentComputeInstanceSpecs()

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
    organization === undefined
      ? `/`
      : organization.plan.id === 'free'
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
  }, [dateRange])

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
  }, [dateRange])

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

  const { data: infraMonitoringData, isPending: isLoadingInfraData } =
    useInfraMonitoringAttributesQuery({
      projectRef,
      attributes: INFRA_ATTRIBUTES,
      interval,
      startDate,
      endDate,
      databaseIdentifier: state.selectedDatabaseId,
    })

  const transformedData = useMemo(() => {
    if (!infraMonitoringData) return undefined
    return mapMultiResponseToAnalyticsData(infraMonitoringData, INFRA_ATTRIBUTES, dateFormat)
  }, [infraMonitoringData, dateFormat])

  const cpuUsageData = transformedData?.max_cpu_usage
  const memoryUsageData = transformedData?.ram_usage
  const ioBudgetData = transformedData?.disk_io_consumption

  const hasLatest = dayjs(endDate!).isAfter(dayjs().startOf('day'))

  const latestIoBudgetConsumption =
    hasLatest && ioBudgetData?.data?.slice(-1)?.[0]
      ? Number(ioBudgetData.data.slice(-1)[0].disk_io_consumption)
      : 0

  const highestIoBudgetConsumption = (ioBudgetData?.data || [])
    .map((x) => Number(x.disk_io_consumption) ?? 0)
    .reduce((a, b) => Math.max(a, b), 0)

  const chartMeta: { [key: string]: { data: DataPoint[]; isLoading: boolean } } = {
    max_cpu_usage: {
      isLoading: isLoadingInfraData,
      data: cpuUsageData?.data ?? [],
    },
    ram_usage: {
      isLoading: isLoadingInfraData,
      data: memoryUsageData?.data ?? [],
    },
    disk_io_consumption: {
      isLoading: isLoadingInfraData,
      data: ioBudgetData?.data ?? [],
    },
  }

  return (
    <>
      <ScaffoldContainer id="infrastructure-activity">
        <div className="mx-auto flex flex-col gap-10 pt-6">
          <div>
            <p className="text-xl">Infrastructure Activity</p>
            <p className="text-sm text-foreground-light">
              Activity statistics related to your server instance
            </p>
          </div>
        </div>
      </ScaffoldContainer>
      <ScaffoldContainer className="sticky top-0 py-6 border-b bg-studio z-10">
        <div className="flex items-center gap-x-4">
          <DatabaseSelector />
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
                              <ExternalLink size={16} strokeWidth={1.5} />
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
                            Your current compute has a baseline and maximum disk throughput of{' '}
                            {currentComputeInstanceSpecs.max_disk_io_mbs?.toLocaleString()} Mbps.
                          </p>
                        ) : (
                          <p className="text-sm text-foreground-light">
                            Your current compute can burst above the baseline disk throughput of{' '}
                            {currentComputeInstanceSpecs.baseline_disk_io_mbs?.toLocaleString()}{' '}
                            Mbps for short periods of time.
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm mb-2">Overview</p>
                        <div className="flex items-center justify-between border-b py-1">
                          <p className="text-xs text-foreground-light">Current compute instance</p>
                          <p className="text-xs">
                            {computeInstance?.variant?.name ??
                              capitalize(project?.infra_compute_size) ??
                              'Micro'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between border-b py-1">
                          <p className="text-xs text-foreground-light">Baseline IO Bandwidth</p>
                          <p className="text-xs">
                            {currentComputeInstanceSpecs.baseline_disk_io_mbs?.toLocaleString()}{' '}
                            Mbps
                          </p>
                        </div>
                        <div className="flex items-center justify-between border-b py-1">
                          <p className="text-xs text-foreground-light">
                            Maximum IO Bandwidth (burst limit)
                          </p>
                          <p className="text-xs">
                            {currentComputeInstanceSpecs.max_disk_io_mbs?.toLocaleString()} Mbps
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
                  {attribute.key === 'disk_io_consumption' && hasDedicatedIOResources ? (
                    <>
                      <Admonition
                        type="note"
                        title={`Your compute instance of ${computeInstance.variant.name} comes with dedicated I/O resources`}
                        description="Your project thus does not rely on I/O balance or burst capacity as larger
                      add-ons are designed for sustained, high performance with specific IOPS and
                      throughput limits without needing to burst."
                      >
                        <DocsButton
                          abbrev={false}
                          href={`${DOCS_URL}/guides/platform/compute-add-ons#disk-throughput-and-iops`}
                        />
                      </Admonition>
                    </>
                  ) : chartMeta[attribute.key].isLoading ? (
                    <div className="space-y-2">
                      <ShimmeringLoader />
                      <ShimmeringLoader className="w-3/4" />
                      <ShimmeringLoader className="w-1/2" />
                    </div>
                  ) : chartData.length ? (
                    <UsageBarChart
                      name={`${attribute.chartPrefix || ''} ${attribute.name}`}
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
                          <BarChart2 size={18} className="text-foreground-light mb-2" />
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
