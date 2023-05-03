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
import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import Link from 'next/link'
import { Badge, Button, IconAlertTriangle, IconExternalLink } from 'ui'
import { USAGE_APPROACHING_THRESHOLD } from '../Billing.constants'
import BarChart from './BarChart'
import SectionContent from './SectionContent'
import SectionHeader from './SectionHeader'
import { USAGE_CATEGORIES } from './Usage.constants'

export interface SizeAndCountsProps {
  projectRef: string
}

const SizeAndCounts = ({ projectRef }: SizeAndCountsProps) => {
  const { data: usage } = useProjectUsageQuery({ projectRef })
  const { data: subscription } = useProjectSubscriptionQuery({ projectRef })
  const { current_period_start, current_period_end } = subscription?.billing ?? {}
  const startDate = new Date((current_period_start ?? 0) * 1000).toISOString()
  const endDate = new Date((current_period_end ?? 0) * 1000).toISOString()
  const categoryMeta = USAGE_CATEGORIES.find((category) => category.key === 'sizeCount')

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

  const chartMeta: any = {
    db_size: { isLoading: isLoadingDbSizeData, data: dbSizeData?.data ?? [] },
    storage_size: { isLoading: isLoadingStorageSizeData, data: storageSizeData?.data ?? [] },
    func_count: { isLoading: isLoadingFunctionCountData, data: functionCountData?.data ?? [] },
  }

  if (categoryMeta === undefined) return null

  return (
    <>
      <SectionHeader title="Size & Counts" description="Some description here" />

      {categoryMeta.attributes.map((attribute) => {
        const usageMeta = usage?.[attribute.key as keyof ProjectUsageResponse] as UsageMetric
        const usageRatio =
          typeof usageMeta !== 'number' ? (usageMeta?.usage ?? 0) / (usageMeta?.limit ?? 0) : 0
        const usageExcess = (usageMeta?.usage ?? 0) - (usageMeta?.limit ?? 0)

        return (
          <SectionContent
            key={attribute.key}
            title={attribute.name}
            description={attribute.description}
          >
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
                <Button type="default" size="tiny" onClick={() => {}}>
                  Upgrade project
                </Button>
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
                  <p className="text-xs">
                    {attribute.unit === 'bytes'
                      ? formatBytes(usageMeta?.limit ?? 0)
                      : (usageMeta?.limit ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center justify-between border-b py-1">
                  <p className="text-xs text-scale-1000">Used</p>
                  <p className="text-xs">
                    {attribute.unit === 'bytes'
                      ? formatBytes(usageMeta?.usage ?? 0)
                      : (usageMeta?.usage ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center justify-between py-1">
                  <p className="text-xs text-scale-1000">Extra volume used this month</p>
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
              <p>{attribute.name} over time</p>
              <p className="text-sm text-scale-1000">{attribute.chartDescription}</p>
            </div>
            {chartMeta[attribute.key].isLoading ? (
              <div className="space-y-2">
                <ShimmeringLoader />
                <ShimmeringLoader className="w-3/4" />
                <ShimmeringLoader className="w-1/2" />
              </div>
            ) : (
              <BarChart
                hasQuota
                attribute={attribute.attribute}
                data={chartMeta[attribute.key]?.data ?? []}
                yLimit={usageMeta?.limit ?? 0}
                yLeftMargin={14}
                yFormatter={(value) =>
                  attribute.unit === 'bytes'
                    ? formatBytes(value, 1, 'GB').replace(/\s/g, '')
                    : value.toLocaleString()
                }
              />
            )}
          </SectionContent>
        )
      })}
    </>
  )
}

export default SizeAndCounts
