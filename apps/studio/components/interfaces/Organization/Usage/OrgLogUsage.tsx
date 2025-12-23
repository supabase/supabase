import { DataPoint } from 'data/analytics/constants'
import { PricingMetric, type OrgDailyUsageResponse } from 'data/analytics/org-daily-stats-query'
import type { OrgSubscription } from 'data/subscriptions/types'
import UsageSection from './UsageSection/UsageSection'
import { dailyUsageToDataPoints } from './Usage.utils'

export interface OrgLogUsageProps {
  orgSlug: string
  projectRef?: string | null
  startDate: string | undefined
  endDate: string | undefined
  subscription: OrgSubscription | undefined
  currentBillingCycleSelected: boolean
  orgDailyStats: OrgDailyUsageResponse | undefined
  isLoadingOrgDailyStats: boolean
}

const OrgLogUsage = ({
  orgSlug,
  projectRef,
  subscription,
  currentBillingCycleSelected,
  orgDailyStats,
  isLoadingOrgDailyStats,
}: OrgLogUsageProps) => {
  const chartMeta: {
    [key: string]: { data: DataPoint[]; margin: number; isLoading: boolean }
  } = {
    [PricingMetric.LOG_INGESTION]: {
      data: dailyUsageToDataPoints(
        orgDailyStats,
        (metric) => metric === PricingMetric.LOG_INGESTION
      ),
      margin: 18,
      isLoading: isLoadingOrgDailyStats,
    },
    [PricingMetric.LOG_QUERYING]: {
      data: dailyUsageToDataPoints(
        orgDailyStats,
        (metric) => metric === PricingMetric.LOG_QUERYING
      ),
      margin: 20,
      isLoading: isLoadingOrgDailyStats,
    },
    [PricingMetric.LOG_STORAGE]: {
      data: dailyUsageToDataPoints(orgDailyStats, (metric) => metric === PricingMetric.LOG_STORAGE),
      margin: 0,
      isLoading: isLoadingOrgDailyStats,
    },
  }

  return (
    <UsageSection
      orgSlug={orgSlug}
      projectRef={projectRef}
      categoryKey="logs"
      chartMeta={chartMeta}
      subscription={subscription}
      currentBillingCycleSelected={currentBillingCycleSelected}
    />
  )
}

export default OrgLogUsage
