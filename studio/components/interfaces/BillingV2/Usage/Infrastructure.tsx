import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { DataPoint } from 'data/analytics/constants'
import { useInfraMonitoringQuery } from 'data/analytics/infra-monitoring-query'
import dayjs from 'dayjs'
import Link from 'next/link'
import { Alert, Button, IconBarChart2 } from 'ui'
import SectionContent from './SectionContent'
import SectionHeader from './SectionHeader'
import { COMPUTE_INSTANCE_SPECS, USAGE_CATEGORIES } from './Usage.constants'
import { getUpgradeUrlFromV2Subscription } from './Usage.utils'
import UsageBarChart from './UsageBarChart'
import Panel from 'components/ui/Panel'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'
import { useFlag } from 'hooks'

export interface InfrastructureProps {
  projectRef: string
  startDate?: string
  endDate?: string
  currentBillingCycleSelected: boolean
}

const Infrastructure = ({
  projectRef,
  startDate,
  endDate,
  currentBillingCycleSelected,
}: InfrastructureProps) => {
  const enableSubscriptionV2 = useFlag('subscriptionV2')
  const { data: subscription } = useProjectSubscriptionV2Query({ projectRef })

  const categoryMeta = USAGE_CATEGORIES.find((category) => category.key === 'infra')

  const upgradeUrl = getUpgradeUrlFromV2Subscription(projectRef, subscription, enableSubscriptionV2)
  const isFreeTier = subscription?.plan?.id === 'free'
  const currentComputeInstance = subscription?.addons.find((addon) =>
    addon.supabase_prod_id.includes('_instance_')
  )
  const currentComputeInstanceSpecs =
    COMPUTE_INSTANCE_SPECS[currentComputeInstance?.supabase_prod_id ?? 'addon_instance_micro']

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
    attribute: 'cpu_usage',
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

  const highestIoBudgetConsumption = Math.max(
    ...(ioBudgetData?.data || []).map((x) => Number(x.disk_io_consumption) ?? 0),
    0
  )

  const chartMeta: { [key: string]: { data: DataPoint[]; isLoading: boolean } } = {
    cpu_usage: {
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

  if (categoryMeta === undefined) return null

  return (
    <>
      <SectionHeader title={categoryMeta.name} description={categoryMeta.description} />
      {categoryMeta.attributes.map((attribute) => {
        const chartData = chartMeta[attribute.key]?.data ?? []

        return (
          <div id={attribute.anchor} key={attribute.key}>
            <SectionContent section={attribute}>
              {attribute.key === 'disk_io_consumption' && (
                <>
                  {currentBillingCycleSelected && highestIoBudgetConsumption >= 100 ? (
                    <Alert withIcon variant="danger" title="IO Budget for today has been used up">
                      <p className="mb-4">
                        Your workload has used up all the burst IO throughput minutes and ran at the
                        baseline performance. If you need consistent disk performance, consider
                        upgrading to a larger compute add-on.
                      </p>
                      <Link href={upgradeUrl}>
                        <a>
                          <Button type="danger">
                            {isFreeTier ? 'Upgrade project' : 'Change compute add-on'}
                          </Button>
                        </a>
                      </Link>
                    </Alert>
                  ) : currentBillingCycleSelected && highestIoBudgetConsumption >= 80 ? (
                    <Alert withIcon variant="warning" title="IO Budget for today is running out">
                      <p className="mb-4">
                        Your workload is about to use up all the burst IO throughput minutes during
                        the day. Once this is completely used up, your workload will run at the
                        baseline performance. If you need consistent disk performance, consider
                        upgrading to a larger compute add-on.
                      </p>
                      <Link href={upgradeUrl}>
                        <a>
                          <Button type="warning">
                            {isFreeTier ? 'Upgrade project' : 'Change compute add-on'}
                          </Button>
                        </a>
                      </Link>
                    </Alert>
                  ) : null}
                  <div className="space-y-1">
                    <p>Disk IO Bandwidth</p>

                    {currentComputeInstanceSpecs.maxBandwidth ===
                    currentComputeInstanceSpecs.baseBandwidth ? (
                      <p className="text-sm text-scale-1000">
                        Your current compute can has a baseline and maximum disk throughput of
                        {currentComputeInstanceSpecs.maxBandwidth.toLocaleString()} Mbps.
                      </p>
                    ) : (
                      <p className="text-sm text-scale-1000">
                        Your current compute can burst up to{' '}
                        {currentComputeInstanceSpecs.maxBandwidth.toLocaleString()} Mbps for 30
                        minutes a day and reverts to the baseline performance of{' '}
                        {currentComputeInstanceSpecs.baseBandwidth.toLocaleString()} Mbps.
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm mb-2">Overview</p>
                    <div className="flex items-center justify-between border-b py-1">
                      <p className="text-xs text-scale-1000">Current compute instance</p>
                      <p className="text-xs">{currentComputeInstance?.name ?? 'Micro'}</p>
                    </div>
                    <div className="flex items-center justify-between border-b py-1">
                      <p className="text-xs text-scale-1000">Maximum IO Bandwidth (burst limit)</p>
                      <p className="text-xs">
                        {currentComputeInstanceSpecs.maxBandwidth.toLocaleString()} Mbps
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-b py-1">
                      <p className="text-xs text-scale-1000">Baseline IO Bandwidth</p>
                      <p className="text-xs">
                        {currentComputeInstanceSpecs.baseBandwidth.toLocaleString()} Mbps
                      </p>
                    </div>
                    {currentComputeInstanceSpecs.maxBandwidth !==
                      currentComputeInstanceSpecs.baseBandwidth && (
                      <div className="flex items-center justify-between py-1">
                        <p className="text-xs text-scale-1000">Daily burst time limit</p>
                        <p className="text-xs">30 mins</p>
                      </div>
                    )}
                  </div>
                </>
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
                  <div className="text-sm text-scale-1000">
                    <p>
                      Your compute instance has {currentComputeInstanceSpecs.memoryGb} GB of memory.
                    </p>
                    {currentComputeInstanceSpecs.memoryGb === 1 && (
                      <p>
                        As your project is running on the smallest compute instance, it is not
                        unusual for your project to have a base memory usage of ~50%.
                      </p>
                    )}
                  </div>
                )}

                {attribute.key === 'cpu_usage' && (
                  <p className="text-sm text-scale-1000">
                    Your compute instance has {currentComputeInstanceSpecs.cpuCores} CPU cores.
                  </p>
                )}

                {attribute.chartDescription.split('\n').map((paragraph, idx) => (
                  <p key={`para-${idx}`} className="text-sm text-scale-1000">
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
                  attribute={attribute.attribute}
                  data={chartData}
                  yFormatter={(value) => `${value}%`}
                  yLimit={100}
                />
              ) : (
                <Panel>
                  <Panel.Content>
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <IconBarChart2 className="text-scale-1100 mb-2" />
                      <p className="text-sm">No data in period</p>
                      <p className="text-sm text-scale-1000">May take a few minutes to show</p>
                    </div>
                  </Panel.Content>
                </Panel>
              )}
            </SectionContent>
          </div>
        )
      })}
    </>
  )
}

export default Infrastructure
