import { DataPoint } from 'data/analytics/constants'
import {
  PricingMetric,
  useOrgDailyStatsQuery,
  type OrgDailyUsageResponse,
} from 'data/analytics/org-daily-stats-query'
import type { OrgSubscription } from 'data/subscriptions/types'
import UsageSection from './UsageSection/UsageSection'
import { dailyUsageToDataPoints } from './Usage.utils'

export interface SizeAndCountsProps {
  orgSlug: string
  projectRef?: string
  subscription: OrgSubscription | undefined
  currentBillingCycleSelected: boolean
  orgDailyStats: OrgDailyUsageResponse | undefined
  isLoadingOrgDailyStats: boolean
}

const SizeAndCounts = ({
  orgSlug,
  projectRef,
  subscription,
  currentBillingCycleSelected,
  orgDailyStats,
  isLoadingOrgDailyStats,
}: SizeAndCountsProps) => {
  const chartMeta: {
    [key: string]: { data: DataPoint[]; margin: number; isLoading: boolean }
  } = {
    [PricingMetric.STORAGE_SIZE]: {
      isLoading: isLoadingOrgDailyStats,
      margin: 14,
      data: dailyUsageToDataPoints(
        orgDailyStats,
        (metric) => metric === PricingMetric.STORAGE_SIZE
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
    />
  )
}

export default SizeAndCounts
