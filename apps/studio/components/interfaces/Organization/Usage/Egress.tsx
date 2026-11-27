import { EgressDebugButton } from './EgressDebugButton'
import { dailyUsageToDataPoints } from './Usage.utils'
import UsageSection from './UsageSection/UsageSection'
import { DataPoint } from '@/data/analytics/constants'
import { PricingMetric, type OrgDailyUsageResponse } from '@/data/analytics/org-daily-stats-query'
import type { OrgSubscription } from '@/data/subscriptions/types'

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

  // Sum each metric over the billing period to find which egress type is largest.
  // DataPoint keys are the metric name lowercased (set by dailyUsageToDataPoints).
  const egressKey = PricingMetric.EGRESS.toLowerCase()
  const cachedEgressKey = PricingMetric.CACHED_EGRESS.toLowerCase()
  const egressTotal = chartMeta[PricingMetric.EGRESS].data.reduce(
    (sum, dp) => sum + Number(dp[egressKey] ?? 0),
    0
  )
  const cachedEgressTotal = chartMeta[PricingMetric.CACHED_EGRESS].data.reduce(
    (sum, dp) => sum + Number(dp[cachedEgressKey] ?? 0),
    0
  )
  const highestEgressType =
    egressTotal === 0 && cachedEgressTotal === 0
      ? null
      : egressTotal >= cachedEgressTotal
        ? 'Egress'
        : 'Cached Egress'

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
      headerActions={
        <EgressDebugButton
          projectRef={projectRef}
          orgSlug={orgSlug}
          highestEgressType={highestEgressType}
        />
      }
    />
  )
}

export default Egress
