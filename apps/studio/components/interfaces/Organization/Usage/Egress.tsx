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

/**
 * Builds a cached-vs-uncached series for the Cached Egress chart. The EGRESS
 * metric is treated as uncached egress and CACHED_EGRESS as cached, so the two
 * stack to the period total — matching the "Egress by type" view.
 *
 * NOTE: confirm this split with billing before shipping and validate it on a
 * storage-heavy project. In-product copy has described the EGRESS metric
 * inconsistently (uncached vs. total), so the exact semantics need a check.
 */
function egressCacheSplitDataPoints(orgDailyStats: OrgDailyUsageResponse | undefined): DataPoint[] {
  const uncachedPoints = dailyUsageToDataPoints(
    orgDailyStats,
    (metric) => metric === PricingMetric.EGRESS
  )
  const cachedPoints = dailyUsageToDataPoints(
    orgDailyStats,
    (metric) => metric === PricingMetric.CACHED_EGRESS
  )

  const byDate = new Map<string, DataPoint>()
  for (const point of uncachedPoints) {
    byDate.set(point.period_start, {
      period_start: point.period_start,
      periodStartFormatted: point.periodStartFormatted ?? '',
      uncached_egress: Number(point.egress ?? 0),
      cached_egress: 0,
    })
  }
  for (const point of cachedPoints) {
    const cached = Number(point.cached_egress ?? 0)
    const existing = byDate.get(point.period_start)
    if (existing !== undefined) {
      existing.cached_egress = cached
    } else {
      byDate.set(point.period_start, {
        period_start: point.period_start,
        periodStartFormatted: point.periodStartFormatted ?? '',
        uncached_egress: 0,
        cached_egress: cached,
      })
    }
  }

  return Array.from(byDate.values())
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
      data: egressCacheSplitDataPoints(orgDailyStats),
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
