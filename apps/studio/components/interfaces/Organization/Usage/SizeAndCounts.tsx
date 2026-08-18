import { useQuery } from '@tanstack/react-query'

import { toStorageSizeChartData } from './StorageRetention/StorageRetention.utils'
import { dailyUsageToDataPoints } from './Usage.utils'
import UsageSection from './UsageSection/UsageSection'
import { useIsStorageVersioningEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { DataPoint } from '@/data/analytics/constants'
import { PricingMetric, type OrgDailyUsageResponse } from '@/data/analytics/org-daily-stats-query'
import { storageRetentionUsageQueryOptions } from '@/data/storage/versioning/storage-retention-usage-query'
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
  const isStorageVersioningEnabled = useIsStorageVersioningEnabled()

  // The daily org stats don't break Storage Size into segments; that split comes
  // from the retention endpoint.
  const { data: retention, isPending: isLoadingRetention } = useQuery({
    ...storageRetentionUsageQueryOptions({ orgSlug }),
    enabled: isStorageVersioningEnabled,
  })

  const storageSizeChartMeta = isStorageVersioningEnabled
    ? {
        isLoading: isLoadingRetention,
        margin: 14,
        data: toStorageSizeChartData(retention?.daily ?? []),
      }
    : {
        isLoading: isLoadingOrgDailyStats,
        margin: 14,
        data: dailyUsageToDataPoints(
          orgDailyStats,
          (metric) => metric === PricingMetric.STORAGE_SIZE
        ),
      }

  const chartMeta: {
    [key: string]: { data: DataPoint[]; margin: number; isLoading: boolean }
  } = {
    [PricingMetric.STORAGE_SIZE]: storageSizeChartMeta,
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
