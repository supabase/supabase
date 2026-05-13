import { useParams } from 'common'
import dayjs from 'dayjs'
import { BarChart2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Fragment, useMemo, useState } from 'react'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { INFRA_ACTIVITY_METRICS } from './Infrastructure.constants'
import { getAddons } from '@/components/interfaces/Billing/Subscription/Subscription.utils'
import { CPUWarnings } from '@/components/interfaces/Billing/Usage/UsageWarningAlerts/CPUWarnings'
import { RAMWarnings } from '@/components/interfaces/Billing/Usage/UsageWarningAlerts/RAMWarnings'
import UsageBarChart from '@/components/interfaces/Organization/Usage/UsageBarChart'
import {
  ScaffoldContainer,
  ScaffoldDivider,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from '@/components/layouts/Scaffold'
import { DatabaseSelector } from '@/components/ui/DatabaseSelector'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import Panel from '@/components/ui/Panel'
import { DataPoint } from '@/data/analytics/constants'
import { mapMultiResponseToAnalyticsData } from '@/data/analytics/infra-monitoring-queries'
import {
  InfraMonitoringAttribute,
  useInfraMonitoringAttributesQuery,
} from '@/data/analytics/infra-monitoring-query'
import { useOrgSubscriptionQuery } from '@/data/subscriptions/org-subscription-query'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'
import { useResourceWarningsQuery } from '@/data/usage/resource-warnings-query'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { INSTANCE_MICRO_SPECS, INSTANCE_NANO_SPECS, InstanceSpecs } from '@/lib/constants'
import { TIME_PERIODS_BILLING, TIME_PERIODS_REPORTS } from '@/lib/constants/metrics'
import { formatBytes } from '@/lib/helpers'
import { useDatabaseSelectorStateSnapshot } from '@/state/database-selector'

const INFRA_ATTRIBUTES: InfraMonitoringAttribute[] = [
  'max_cpu_usage',
  'ram_usage',
  'disk_bytes_read',
  'disk_bytes_written',
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
  const { hasAccess: hasAccessToComputeSizes } = useCheckEntitlements(
    'instances.compute_update_available_sizes'
  )

  const { data: resourceWarnings } = useResourceWarningsQuery({ ref: projectRef })
  // [Joshen Cleanup] JFYI this client side filtering can be cleaned up once BE changes are live which will only return the warnings based on the provided ref
  const projectResourceWarnings = resourceWarnings?.find((x) => x.project === projectRef)

  const { data: addons } = useProjectAddonsQuery({ projectRef })
  const selectedAddons = addons?.selected_addons ?? []

  const { computeInstance } = getAddons(selectedAddons)

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

  const upgradeUrl =
    organization === undefined
      ? `/`
      : hasAccessToComputeSizes
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

  const diskThroughputData = useMemo((): DataPoint[] => {
    const readData = transformedData?.disk_bytes_read?.data ?? []
    const writeData = transformedData?.disk_bytes_written?.data ?? []
    return readData.map((point, i) => ({
      ...point,
      disk_bytes_written: writeData[i]?.disk_bytes_written ?? 0,
    }))
  }, [transformedData])

  const chartMeta: { [key: string]: { data: DataPoint[]; isLoading: boolean } } = {
    max_cpu_usage: {
      isLoading: isLoadingInfraData,
      data: cpuUsageData?.data ?? [],
    },
    ram_usage: {
      isLoading: isLoadingInfraData,
      data: memoryUsageData?.data ?? [],
    },
    disk_throughput: {
      isLoading: isLoadingInfraData,
      data: diskThroughputData,
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
                  {attribute.key === 'max_cpu_usage' && (
                    <CPUWarnings
                      upgradeUrl={upgradeUrl}
                      hasAccessToComputeSizes={hasAccessToComputeSizes}
                      severity={projectResourceWarnings?.cpu_exhaustion}
                    />
                  )}
                  {attribute.key === 'ram_usage' && (
                    <RAMWarnings
                      upgradeUrl={upgradeUrl}
                      hasAccessToComputeSizes={hasAccessToComputeSizes}
                      severity={projectResourceWarnings?.memory_and_swap_exhaustion}
                    />
                  )}

                  <div className="space-y-1">
                    <div className="flex flex-row justify-between">
                      {attribute.key === 'disk_throughput' ? (
                        <p>Disk throughput per {interval === '1d' ? 'day' : 'hour'}</p>
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
                    attribute.key === 'disk_throughput' ? (
                      <UsageBarChart
                        name={attribute.name}
                        unit={attribute.unit}
                        attributes={attribute.attributes}
                        data={chartData}
                        yFormatter={(value) => `${formatBytes(Number(value), 1)}/s`}
                        tooltipFormatter={(value) => `${formatBytes(Number(value), 1)}/s`}
                      />
                    ) : (
                      <UsageBarChart
                        name={`${attribute.chartPrefix || ''} ${attribute.name}`}
                        unit={attribute.unit}
                        attributes={attribute.attributes}
                        data={chartData}
                        yFormatter={(value) => `${Math.round(Number(value))}%`}
                        tooltipFormatter={(value) => `${value}%`}
                        yLimit={100}
                      />
                    )
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
