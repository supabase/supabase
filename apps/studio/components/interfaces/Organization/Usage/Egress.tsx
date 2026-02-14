import { DataPoint } from 'data/analytics/constants'
import { PricingMetric, type OrgDailyUsageResponse } from 'data/analytics/org-daily-stats-query'
import type { OrgSubscription } from 'data/subscriptions/types'
import UsageSection from './UsageSection/UsageSection'
import { dailyUsageToDataPoints } from './Usage.utils'

export interface EgressProps {
  orgSlug: string
  projectRef: string | null
  subscription: OrgSubscription | undefined
  currentBillingCycleSelected: boolean
  orgDailyStats: OrgDailyUsageResponse | undefined
  isLoadingOrgDailyStats: boolean
  startDate: string | undefined
  endDate: string | undefined
}

const Egress = ({
  orgSlug,
  projectRef,
  subscription,
  currentBillingCycleSelected,
  orgDailyStats,
  isLoadingOrgDailyStats,
  startDate,
  endDate,
}: EgressProps) => {
  const chartMeta: {
    [key: string]: { data: DataPoint[]; margin: number; isLoading: boolean }
  } = {
    [PricingMetric.EGRESS]: {
      data: dailyUsageToDataPoints(orgDailyStats, (metric) => metric === PricingMetric.EGRESS),
      margin: 16,
      isLoading: isLoadingOrgDailyStats,
    },
    [PricingMetric.CACHED_EGRESS]: {
      data: dailyUsageToDataPoints(
        orgDailyStats,
        (metric) => metric === PricingMetric.CACHED_EGRESS
      ),
      margin: 16,
      isLoading: isLoadingOrgDailyStats,
    },
  }

  return (
    <UsageSection
      orgSlug={orgSlug}
      projectRef={projectRef}
      categoryKey="egress"
      chartMeta={chartMeta}
      subscription={subscription}
      currentBillingCycleSelected={currentBillingCycleSelected}
      startDate={startDate}
      endDate={endDate}
    />
  )
}

export default Egress
