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
import { PRICING_TIER_PRODUCT_IDS, USAGE_APPROACHING_THRESHOLD } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import Link from 'next/link'
import { Button, IconAlertTriangle } from 'ui'
import BarChart from './BarChart'
import SectionContent from './SectionContent'
import SectionHeader from './SectionHeader'
import { USAGE_CATEGORIES } from './Usage.constants'

export interface BandwidthProps {
  projectRef: string
}

const Bandwidth = ({ projectRef }: BandwidthProps) => {
  const { data: usage } = useProjectUsageQuery({ projectRef })
  const { data: subscription } = useProjectSubscriptionQuery({ projectRef })
  const { current_period_start, current_period_end } = subscription?.billing ?? {}
  const startDate = new Date((current_period_start ?? 0) * 1000).toISOString()
  const endDate = new Date((current_period_end ?? 0) * 1000).toISOString()
  const categoryMeta = USAGE_CATEGORIES.find((category) => category.key === 'bandwidth')

  const upgradeUrl =
    subscription?.tier.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.ENTERPRISE
      ? `/project/${projectRef}/settings/billing/update/enterprise`
      : subscription?.tier.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.TEAM
      ? `/project/${projectRef}/settings/billing/update/team`
      : `/project/${projectRef}/settings/billing/update/pro`

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

  const chartMeta: any = {
    db_egress: {
      isLoading: isLoadingDbEgressData,
      data: dbEgressData?.data ?? [],
      showLastUpdated: dbEgressData?.hasNoData === false,
    },
    storage_egress: {
      isLoading: isLoadingStorageEgressData,
      data: storageEgressData?.data ?? [],
      showLastUpdated: storageEgressData?.hasNoData === false,
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

        // [Joshen] Ideally this should come from the API imo, foresee some discrepancies
        const lastZeroValue = chartData.find(
          (x: any) => x.loopId > 0 && x[attribute.attribute] === 0
        )
        const lastKnownValue =
          lastZeroValue !== undefined
            ? dayjs(lastZeroValue.period_start)
                .subtract(1, 'day')
                .format('DD MMM YYYY, HH:mma (ZZ)')
            : undefined

        return (
          <SectionContent key={attribute.key} section={attribute}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <p className="text-sm">
                    {attribute.name} {subscription?.tier.key.toLowerCase()} quota usage
                  </p>
                  {usageRatio >= 1 ? (
                    <div className="flex items-center space-x-2 min-w-[115px]">
                      <IconAlertTriangle size={14} strokeWidth={2} className="text-red-900" />
                      <p className="text-sm text-red-900">Exceeded limit</p>
                    </div>
                  ) : usageRatio >= USAGE_APPROACHING_THRESHOLD ? (
                    <div className="flex items-center space-x-2 min-w-[115px]">
                      <IconAlertTriangle size={14} strokeWidth={2} className="text-amber-900" />
                      <p className="text-sm text-red-900">Reaching limit</p>
                    </div>
                  ) : null}
                </div>
                <Link href={upgradeUrl}>
                  <a>
                    <Button type="default" size="tiny">
                      Upgrade project
                    </Button>
                  </a>
                </Link>
              </div>
              <SparkBar
                type="horizontal"
                barClass={clsx(
                  usageRatio >= 1
                    ? 'bg-red-900'
                    : usageRatio >= USAGE_APPROACHING_THRESHOLD
                    ? 'bg-amber-900'
                    : 'bg-scale-1100'
                )}
                value={usageMeta?.usage ?? 0}
                max={usageMeta?.limit ?? 0}
              />
              <div>
                <div className="flex items-center justify-between border-b py-1">
                  <p className="text-xs text-scale-1000">
                    Included in {subscription?.tier.name.toLowerCase()}
                  </p>
                  <p className="text-xs">{formatBytes(usageMeta?.limit ?? 0)}</p>
                </div>
                <div className="flex items-center justify-between border-b py-1">
                  <p className="text-xs text-scale-1000">Used</p>
                  <p className="text-xs">{formatBytes(usageMeta?.usage ?? 0)}</p>
                </div>
                <div className="flex items-center justify-between py-1">
                  <p className="text-xs text-scale-1000">Extra volume used this month</p>
                  <p className="text-xs">
                    {usageExcess < 0 ? formatBytes(0) : formatBytes(usageExcess)}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <p>{attribute.name} over time</p>
              {attribute.chartDescription.split('\n').map((paragraph, idx) => (
                <p key={`para-${idx}`} className="text-sm text-scale-1000">
                  {paragraph}
                </p>
              ))}
              {lastKnownValue !== undefined && chartMeta[attribute.key].showLastUpdated && (
                <span className="text-sm text-scale-1000">Last updated at: {lastKnownValue}</span>
              )}
            </div>
            {chartMeta[attribute.key]?.isLoading ? (
              <div className="space-y-2">
                <ShimmeringLoader />
                <ShimmeringLoader className="w-3/4" />
                <ShimmeringLoader className="w-1/2" />
              </div>
            ) : (
              <BarChart
                hasQuota
                name={attribute.name}
                unit={attribute.unit}
                attribute={attribute.attribute}
                data={chartData}
                yLimit={usageMeta?.limit ?? 0}
                yLeftMargin={14}
                yFormatter={(value) => formatBytes(value, 1, 'GB').replace(/\s/g, '')}
              />
            )}
          </SectionContent>
        )
      })}
    </>
  )
}

export default Bandwidth
