import { DataPoint } from '@/data/analytics/constants'
import { PricingMetric, type OrgDailyUsageResponse } from '@/data/analytics/org-daily-stats-query'
import { useStorageRetentionUsageQuery } from '@/data/storage/protection/storage-retention-usage-query'
import type { OrgSubscription } from '@/data/subscriptions/types'

import { toStorageSizeChartData } from './StorageRetention/StorageRetention.utils'
import { dailyUsageToDataPoints } from './Usage.utils'
import UsageSection from './UsageSection/UsageSection'

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
      isLoading: isLoadingRetention,
      margin: 14,
      // Reads entirely off the mock retention series (current / noncurrent)
      // rather than the real daily-stats endpoint — see
      // StorageRetention.utils.ts.
      data: retention ? toStorageSizeChartData(retention.daily) : [],
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
