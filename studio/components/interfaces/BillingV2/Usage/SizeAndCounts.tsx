import clsx from 'clsx'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import SparkBar from 'components/ui/SparkBar'
import { useDailyStatsQuery } from 'data/analytics/daily-stats-query'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import {
  ProjectUsageResponse,
  UsageMetric,
  useProjectUsageQuery,
} from 'data/usage/project-usage-query'
import dayjs from 'dayjs'
import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import Link from 'next/link'
import { Badge, Button, IconAlertTriangle, IconExternalLink } from 'ui'
import { USAGE_APPROACHING_THRESHOLD } from '../Billing.constants'
import UsageBarChart from './UsageBarChart'
import SectionContent from './SectionContent'
import SectionHeader from './SectionHeader'
import { USAGE_CATEGORIES } from './Usage.constants'
import { ChartYFormatterCompactNumber, getUpgradeUrl } from './Usage.utils'
import { DataPoint } from 'data/analytics/constants'

export interface SizeAndCountsProps {
  projectRef: string
}

const SizeAndCounts = ({ projectRef }: SizeAndCountsProps) => {
  const { data: usage } = useProjectUsageQuery({ projectRef })
  const { data: subscription } = useProjectSubscriptionQuery({ projectRef })
  const { current_period_start, current_period_end } = subscription?.billing ?? {}
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

  const categoryMeta = USAGE_CATEGORIES.find((category) => category.key === 'sizeCount')

  const upgradeUrl = getUpgradeUrl(projectRef, subscription)
  const isFreeTier = subscription?.tier.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.FREE
  const isProTier = subscription?.tier.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.PRO
  const usageBasedBilling = !isFreeTier && !isProTier
  const exceededLimitStyle = !usageBasedBilling ? 'text-red-900' : 'text-amber-900'

  const { data: dbSizeData, isLoading: isLoadingDbSizeData } = useDailyStatsQuery({
    projectRef,
    attribute: 'total_db_size_bytes',
    interval: '1d',
    startDate,
    endDate,
  })

  const { data: storageSizeData, isLoading: isLoadingStorageSizeData } = useDailyStatsQuery({
    projectRef,
    attribute: 'total_storage_size_bytes',
    interval: '1d',
    startDate,
    endDate,
  })

  const { data: functionCountData, isLoading: isLoadingFunctionCountData } = useDailyStatsQuery({
    projectRef,
    attribute: 'total_func_count',
    interval: '1d',
    startDate,
    endDate,
  })

  const chartMeta: {
    [key: string]: { data: DataPoint[]; margin: number; isLoading: boolean; hasNoData: boolean }
  } = {
    db_size: {
      isLoading: isLoadingDbSizeData,
      margin: 14,
      data: dbSizeData?.data ?? [],
      hasNoData: dbSizeData?.hasNoData ?? false,
    },
    storage_size: {
      isLoading: isLoadingStorageSizeData,
      margin: 14,
      data: storageSizeData?.data ?? [],
      hasNoData: storageSizeData?.hasNoData ?? false,
    },
    func_count: {
      isLoading: isLoadingFunctionCountData,
      margin: 0,
      data: functionCountData?.data ?? [],
      hasNoData: functionCountData?.hasNoData ?? false,
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
                    value={usageMeta?.usage ?? 0}
                    max={usageMeta?.limit || 1}
                  />
                )}
                <div>
                  <div className="flex items-center justify-between border-b py-1">
                    <p className="text-xs text-scale-1000">
                      Included in {subscription?.tier.name.toLowerCase()}
                    </p>
                    <p className="text-xs">
                      {attribute.unit === 'bytes'
                        ? formatBytes(usageMeta?.limit ?? 0)
                        : (usageMeta?.limit ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <p className="text-xs text-scale-1000">
                      {attribute.chartPrefix || 'Used '}in period
                    </p>
                    <p className="text-xs">
                      {attribute.unit === 'bytes'
                        ? formatBytes(usageMeta?.usage ?? 0)
                        : (usageMeta?.usage ?? 0).toLocaleString()}
                    </p>
                  </div>
                  {usageMeta?.limit > 0 && (
                    <div className="flex items-center justify-between border-t py-1">
                      <p className="text-xs text-scale-1000">Overage this month</p>
                      <p className="text-xs">
                        {usageExcess < 0
                          ? attribute.unit === 'bytes'
                            ? formatBytes(0)
                            : 0
                          : attribute.unit === 'bytes'
                          ? formatBytes(usageExcess)
                          : usageExcess.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {attribute.key === 'db_size' &&
                subscription?.tier.supabase_prod_id !== PRICING_TIER_PRODUCT_IDS.FREE && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm">Disk size:</p>
                      <p className="text-sm">{usage?.disk_volume_size_gb} GB</p>
                      <Badge color="green" size="small">
                        Auto-scaling
                      </Badge>
                    </div>
                    <Link href="https://supabase.com/docs/guides/platform/database-usage#disk-management">
                      <a>
                        <Button size="tiny" type="default" icon={<IconExternalLink size={14} />}>
                          What is disk size?
                        </Button>
                      </a>
                    </Link>
                  </div>
                )}

              <div className="space-y-1">
                <p>
                  {attribute.chartPrefix || ''}
                  {attribute.name} per day
                </p>
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
              ) : (
                <UsageBarChart
                  name={`${attribute.chartPrefix || ''}${attribute.name}`}
                  unit={attribute.unit}
                  attribute={attribute.attribute}
                  data={chartData}
                  yLeftMargin={chartMeta[attribute.key].margin}
                  yFormatter={(value) => ChartYFormatterCompactNumber(value, attribute.unit)}
                />
              )}
            </SectionContent>
          </div>
        )
      })}
    </>
  )
}

export default SizeAndCounts
