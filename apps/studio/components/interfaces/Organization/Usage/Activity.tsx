import { DataPoint } from 'data/analytics/constants'
import { PricingMetric, type OrgDailyUsageResponse } from 'data/analytics/org-daily-stats-query'
import type { OrgSubscription } from 'data/subscriptions/types'
import UsageSection from './UsageSection/UsageSection'
import { dailyUsageToDataPoints } from './Usage.utils'

export interface ActivityProps {
  orgSlug: string
  projectRef?: string
  startDate: string | undefined
  endDate: string | undefined
  subscription: OrgSubscription | undefined
  currentBillingCycleSelected: boolean
  orgDailyStats: OrgDailyUsageResponse | undefined
  isLoadingOrgDailyStats: boolean
}

const Activity = ({
  orgSlug,
  projectRef,
  subscription,
  startDate,
  endDate,
  currentBillingCycleSelected,
  orgDailyStats,
  isLoadingOrgDailyStats,
}: ActivityProps) => {
  const chartMeta: {
    [key: string]: { data: DataPoint[]; margin: number; isLoading: boolean }
  } = {
    [PricingMetric.MONTHLY_ACTIVE_USERS]: {
      data: dailyUsageToDataPoints(
        orgDailyStats,
        (metric) => metric === PricingMetric.MONTHLY_ACTIVE_USERS
      ),
      margin: 18,
      isLoading: isLoadingOrgDailyStats,
    },
    [PricingMetric.MONTHLY_ACTIVE_SSO_USERS]: {
      data: dailyUsageToDataPoints(
        orgDailyStats,
        (metric) => metric === PricingMetric.MONTHLY_ACTIVE_SSO_USERS
      ),
      margin: 20,
      isLoading: isLoadingOrgDailyStats,
    },
    [PricingMetric.STORAGE_IMAGES_TRANSFORMED]: {
      data: dailyUsageToDataPoints(
        orgDailyStats,
        (metric) => metric === PricingMetric.STORAGE_IMAGES_TRANSFORMED
      ),
      margin: 0,
      isLoading: isLoadingOrgDailyStats,
    },
    [PricingMetric.FUNCTION_INVOCATIONS]: {
      data: dailyUsageToDataPoints(
        orgDailyStats,
        (metric) => metric === PricingMetric.FUNCTION_INVOCATIONS
      ),
      margin: 26,
      isLoading: isLoadingOrgDailyStats,
    },
    [PricingMetric.REALTIME_MESSAGE_COUNT]: {
      data: dailyUsageToDataPoints(
        orgDailyStats,
        (metric) => metric === PricingMetric.REALTIME_MESSAGE_COUNT
      ),
      margin: 38,
      isLoading: isLoadingOrgDailyStats,
    },
    [PricingMetric.REALTIME_PEAK_CONNECTIONS]: {
      data: dailyUsageToDataPoints(
        orgDailyStats,
        (metric) => metric === PricingMetric.REALTIME_PEAK_CONNECTIONS
      ),
      margin: 0,
      isLoading: isLoadingOrgDailyStats,
    },
  }

  return (
    <UsageSection
      orgSlug={orgSlug}
      projectRef={projectRef}
      categoryKey="activity"
      chartMeta={chartMeta}
      subscription={subscription}
      currentBillingCycleSelected={currentBillingCycleSelected}
    />
  )
}

export default Activity
