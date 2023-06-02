import clsx from 'clsx'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import SparkBar from 'components/ui/SparkBar'
import { DataPoint } from 'data/analytics/constants'
import { useDailyStatsQuery } from 'data/analytics/daily-stats-query'
import {
  ProjectUsageResponse,
  UsageMetric,
  useProjectUsageQuery,
} from 'data/usage/project-usage-query'
import dayjs from 'dayjs'
import { PRICING_TIER_PRODUCT_IDS, USAGE_APPROACHING_THRESHOLD } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import Link from 'next/link'
import { Button, IconAlertTriangle } from 'ui'
import SectionContent from './SectionContent'
import SectionHeader from './SectionHeader'
import { USAGE_CATEGORIES } from './Usage.constants'
import {
  ChartYFormatterCompactNumber,
  getUpgradeUrl,
  getUpgradeUrlFromV2Subscription,
} from './Usage.utils'
import UsageBarChart from './UsageBarChart'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'
import Panel from 'components/ui/Panel'

export interface BandwidthProps {
  projectRef: string
}

const Bandwidth = ({ projectRef }: BandwidthProps) => {
  const { data: usage } = useProjectUsageQuery({ projectRef })
  const { data: subscription } = useProjectSubscriptionV2Query({ projectRef })
  const { current_period_start, current_period_end } = subscription ?? {}
  const startDate =
    current_period_start !== undefined
      ? new Date(current_period_start * 1000).toISOString()
      : undefined
  let endDate =
    current_period_end !== undefined ? new Date(current_period_end * 1000).toISOString() : undefined
  // If end date is in future, set end date to now
  if (endDate && dayjs(endDate).isAfter(dayjs())) {
    // LF seems to have an issue with the milliseconds, causes infinite loading sometimes
    endDate = new Date().toISOString().slice(0, -5) + 'Z'
  }

  const categoryMeta = USAGE_CATEGORIES.find((category) => category.key === 'bandwidth')

  const upgradeUrl = getUpgradeUrlFromV2Subscription(projectRef, subscription)
  const usageBasedBilling = subscription?.usage_billing_enabled
  const exceededLimitStyle = !usageBasedBilling ? 'text-red-900' : 'text-amber-900'

  const { data: dbEgressData, isLoading: isLoadingDbEgressData } = useDailyStatsQuery({
    projectRef,
    attribute: 'total_egress_modified',
    interval: '1d',
    startDate,
    endDate,
  })

  const { data: storageEgressData, isLoading: isLoadingStorageEgressData } = useDailyStatsQuery({
    projectRef,
    attribute: 'total_storage_egress',
    interval: '1d',
    startDate,
    endDate,
  })

  const chartMeta: {
    [key: string]: { data: DataPoint[]; margin: number; isLoading: boolean; hasNoData: boolean }
  } = {
    db_egress: {
      data: dbEgressData?.data ?? [],
      margin: 16,
      isLoading: isLoadingDbEgressData,
      hasNoData: dbEgressData?.hasNoData ?? false,
    },
    storage_egress: {
      data: storageEgressData?.data ?? [],
      margin: 14,
      isLoading: isLoadingStorageEgressData,
      hasNoData: storageEgressData?.hasNoData ?? false,
    },
  }

  if (categoryMeta === undefined) return null

  return (
    <>
      <SectionHeader title={categoryMeta.name} description={categoryMeta.description} />

      {categoryMeta.attributes.map((attribute) => {
        const usageMeta = usage?.[attribute.key as keyof ProjectUsageResponse] as UsageMetric
        const usageRatio =
          typeof usageMeta !== 'number' ? (usageMeta?.usage ?? 0) / (usageMeta?.limit ?? 0) : 0
        const usageExcess = (usageMeta?.usage ?? 0) - (usageMeta?.limit ?? 0)

        const chartData = chartMeta[attribute.key]?.data ?? []

        const notAllValuesZero = chartData.some(
          (dataPoint) => Number(dataPoint[attribute.attribute]) !== 0
        )

        return (
          <div id={attribute.anchor} key={attribute.key}>
            <SectionContent section={attribute}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <p className="text-sm">{attribute.name} usage</p>
                    {!usageBasedBilling && usageRatio >= 1 ? (
                      <div className="flex items-center space-x-2 min-w-[115px]">
                        <IconAlertTriangle
                          size={14}
                          strokeWidth={2}
                          className={exceededLimitStyle}
                        />
                        <p className={`text-sm ${exceededLimitStyle}`}>Exceeded limit</p>
                      </div>
                    ) : !usageBasedBilling && usageRatio >= USAGE_APPROACHING_THRESHOLD ? (
                      <div className="flex items-center space-x-2 min-w-[115px]">
                        <IconAlertTriangle size={14} strokeWidth={2} className="text-amber-900" />
                        <p className="text-sm text-amber-900">Approaching limit</p>
                      </div>
                    ) : null}
                  </div>
                  {!usageBasedBilling && usageRatio >= USAGE_APPROACHING_THRESHOLD && (
                    <Link href={upgradeUrl}>
                      <a>
                        <Button type="default" size="tiny">
                          Upgrade project
                        </Button>
                      </a>
                    </Link>
                  )}
                </div>
                {usageMeta?.limit > 0 && (
                  <SparkBar
                    type="horizontal"
                    barClass={clsx(
                      usageRatio >= 1
                        ? usageBasedBilling
                          ? 'bg-amber-900'
                          : 'bg-red-900'
                        : usageRatio >= USAGE_APPROACHING_THRESHOLD
                        ? 'bg-amber-900'
                        : 'bg-scale-1100'
                    )}
                    bgClass="bg-gray-300 dark:bg-gray-600"
                    value={usageMeta?.usage ?? 0}
                    max={usageMeta?.limit || 1}
                  />
                )}
                <div>
                  <div className="flex items-center justify-between border-b py-1">
                    <p className="text-xs text-scale-1000">
                      Included in {subscription?.plan?.name.toLowerCase()} plan
                    </p>
                    <p className="text-xs">
                      {usageMeta?.limit === 0 ? 'Unlimited' : formatBytes(usageMeta?.limit ?? 0)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <p className="text-xs text-scale-1000">
                      {attribute.chartPrefix || 'Used '}in period
                    </p>
                    <p className="text-xs">{formatBytes(usageMeta?.usage ?? 0)}</p>
                  </div>
                  {usageMeta?.limit > 0 && (
                    <div className="flex items-center justify-between border-t py-1">
                      <p className="text-xs text-scale-1000">Overage in period</p>
                      <p className="text-xs">
                        {usageExcess < 0 ? formatBytes(0) : formatBytes(usageExcess)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p>{attribute.name} per day</p>
                {attribute.chartDescription.split('\n').map((paragraph, idx) => (
                  <p key={`para-${idx}`} className="text-sm text-scale-1000">
                    {paragraph}
                  </p>
                ))}
              </div>
              {chartMeta[attribute.key]?.isLoading ? (
                <div className="space-y-2">
                  <ShimmeringLoader />
                  <ShimmeringLoader className="w-3/4" />
                  <ShimmeringLoader className="w-1/2" />
                </div>
              ) : chartData.length > 1 && notAllValuesZero ? (
                <UsageBarChart
                  name={`${attribute.chartPrefix || ''}${attribute.name}`}
                  unit={attribute.unit}
                  attribute={attribute.attribute}
                  data={chartData}
                  yLeftMargin={chartMeta[attribute.key].margin}
                  yFormatter={(value) => ChartYFormatterCompactNumber(value, attribute.unit)}
                />
              ) : (
                <Panel>
                  <Panel.Content>
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p>No data</p>
                      <p className="text-sm text-scale-1000">
                        No {notAllValuesZero ? 'data' : 'usage'} in period
                      </p>
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

export default Bandwidth
