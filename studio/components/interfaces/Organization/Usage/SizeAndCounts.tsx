import { useDailyStatsQuery } from 'data/analytics/daily-stats-query'
import { DataPoint } from 'data/analytics/constants'
import { ProjectSubscriptionResponse } from 'data/subscriptions/project-subscription-v2-query'
import UsageSection from './UsageSection'
import { PricingMetric, useOrgDailyStatsQuery } from 'data/analytics/org-daily-stats-query'

export interface SizeAndCountsProps {
  orgSlug: string
  startDate: string | undefined
  endDate: string | undefined
  subscription: ProjectSubscriptionResponse | undefined
  currentBillingCycleSelected: boolean
}

const SizeAndCounts = ({
  orgSlug,
  startDate,
  endDate,
  subscription,
  currentBillingCycleSelected,
}: SizeAndCountsProps) => {
  const { data: dbSizeData, isLoading: isLoadingDbSizeData } = useOrgDailyStatsQuery({
    orgSlug,
    metric: PricingMetric.DATABASE_SIZE,
    interval: '1d',
    startDate,
    endDate,
  })

  const { data: storageSizeData, isLoading: isLoadingStorageSizeData } = useOrgDailyStatsQuery({
    orgSlug,
    metric: PricingMetric.STORAGE_SIZE,
    interval: '1d',
    startDate,
    endDate,
  })

  const { data: functionCountData, isLoading: isLoadingFunctionCountData } = useOrgDailyStatsQuery({
    orgSlug,
    metric: PricingMetric.FUNCTION_COUNT,
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

  return (
    <UsageSection
      orgSlug={orgSlug}
      categoryKey="sizeCount"
      chartMeta={chartMeta}
      subscription={subscription}
      currentBillingCycleSelected={currentBillingCycleSelected}
    />
  )
}

export default SizeAndCounts
