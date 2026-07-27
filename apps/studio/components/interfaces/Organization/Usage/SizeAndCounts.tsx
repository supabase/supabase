import { splitStorageSizeByRetention } from './StorageRetention/StorageRetention.utils'
import { dailyUsageToDataPoints } from './Usage.utils'
import UsageSection from './UsageSection/UsageSection'
import { DataPoint } from '@/data/analytics/constants'
import { PricingMetric, type OrgDailyUsageResponse } from '@/data/analytics/org-daily-stats-query'
import { useStorageRetentionUsageQuery } from '@/data/storage/protection/storage-retention-usage-query'
import type { OrgSubscription } from '@/data/subscriptions/types'

export interface SizeAndCountsProps {
  orgSlug: string
  projectRef?: string | null
  subscription: OrgSubscription | undefined
  currentBillingCycleSelected: boolean
  orgDailyStats: OrgDailyUsageResponse | undefined
  isLoadingOrgDailyStats: boolean
  startDate: string | undefined
  endDate: string | undefined
}

const SizeAndCounts = ({
  orgSlug,
  projectRef,
  subscription,
  currentBillingCycleSelected,
  orgDailyStats,
  isLoadingOrgDailyStats,
  startDate,
  endDate,
}: SizeAndCountsProps) => {
  const { data: retention, isPending: isLoadingRetention } = useStorageRetentionUsageQuery()

  const chartMeta: {
    [key: string]: { data: DataPoint[]; margin: number; isLoading: boolean }
  } = {
    [PricingMetric.STORAGE_SIZE]: {
      isLoading: isLoadingOrgDailyStats || isLoadingRetention,
      margin: 14,
      // Split the reported total into live / versions / snapshots so the chart
      // stacks what is driving Storage Size (the API reports one number today).
      data: splitStorageSizeByRetention(
        dailyUsageToDataPoints(orgDailyStats, (metric) => metric === PricingMetric.STORAGE_SIZE),
        PricingMetric.STORAGE_SIZE.toLowerCase(),
        retention?.totals
      ),
    },
    [PricingMetric.DATABASE_SIZE]: {
      isLoading: isLoadingOrgDailyStats,
      margin: 14,
      data: dailyUsageToDataPoints(
        orgDailyStats,
        (metric) => metric === PricingMetric.DATABASE_SIZE
      ),
    },
  }

  return (
    <UsageSection
      orgSlug={orgSlug}
      projectRef={projectRef}
      categoryKey="sizeCount"
      chartMeta={chartMeta}
      subscription={subscription}
      currentBillingCycleSelected={currentBillingCycleSelected}
      startDate={startDate}
      endDate={endDate}
    />
  )
}

export default SizeAndCounts
