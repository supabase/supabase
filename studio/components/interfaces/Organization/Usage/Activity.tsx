import { DataPoint } from 'data/analytics/constants'
import { ProjectSubscriptionResponse } from 'data/subscriptions/project-subscription-v2-query'
import UsageSection from './UsageSection/UsageSection'
import { PricingMetric, useOrgDailyStatsQuery } from 'data/analytics/org-daily-stats-query'

export interface ActivityProps {
  orgSlug: string
  projectRef?: string // [Joshen TODO] remove
  startDate: string | undefined
  endDate: string | undefined
  subscription: ProjectSubscriptionResponse | undefined
  currentBillingCycleSelected: boolean
}

const Activity = ({
  orgSlug,
  subscription,
  startDate,
  endDate,
  currentBillingCycleSelected,
}: ActivityProps) => {
  const { data: mauData, isLoading: isLoadingMauData } = useOrgDailyStatsQuery({
    orgSlug,
    metric: PricingMetric.MONTHLY_ACTIVE_USERS,
    interval: '1d',
    startDate,
    endDate,
  })

  const { data: mauSSOData, isLoading: isLoadingMauSSOData } = useOrgDailyStatsQuery({
    orgSlug,
    metric: PricingMetric.MONTHLY_ACTIVE_SSO_USERS,
    interval: '1d',
    startDate,
    endDate,
  })

  const { data: assetTransformationsData, isLoading: isLoadingAssetTransformationsData } =
    useOrgDailyStatsQuery({
      orgSlug,
      metric: PricingMetric.STORAGE_IMAGES_TRANSFORMED,
      interval: '1d',
      startDate,
      endDate,
    })

  const { data: funcInvocationsData, isLoading: isLoadingFuncInvocationsData } =
    useOrgDailyStatsQuery({
      orgSlug,
      metric: PricingMetric.FUNCTION_INVOCATIONS,
      interval: '1d',
      startDate,
      endDate,
    })

  const { data: realtimeMessagesData, isLoading: isLoadingRealtimeMessagesData } =
    useOrgDailyStatsQuery({
      orgSlug,
      metric: PricingMetric.REALTIME_MESSAGE_COUNT,
      interval: '1d',
      startDate,
      endDate,
    })

  const { data: realtimeConnectionsData, isLoading: isLoadingRealtimeConnectionsData } =
    useOrgDailyStatsQuery({
      orgSlug,
      metric: PricingMetric.REALTIME_PEAK_CONNECTIONS,
      interval: '1d',
      startDate,
      endDate,
    })

  const chartMeta: {
    [key: string]: { data: DataPoint[]; margin: number; isLoading: boolean; hasNoData: boolean }
  } = {
    [PricingMetric.MONTHLY_ACTIVE_USERS]: {
      data: mauData?.data ?? [],
      margin: 18,
      isLoading: isLoadingMauData,
      hasNoData: mauData?.hasNoData ?? false,
    },
    [PricingMetric.MONTHLY_ACTIVE_SSO_USERS]: {
      data: mauSSOData?.data ?? [],
      margin: 20,
      isLoading: isLoadingMauSSOData,
      hasNoData: mauSSOData?.hasNoData ?? false,
    },
    [PricingMetric.STORAGE_IMAGES_TRANSFORMED]: {
      data: assetTransformationsData?.data ?? [],
      margin: 0,
      isLoading: isLoadingAssetTransformationsData,
      hasNoData: assetTransformationsData?.hasNoData ?? false,
    },
    [PricingMetric.FUNCTION_INVOCATIONS]: {
      data: funcInvocationsData?.data ?? [],
      margin: 26,
      isLoading: isLoadingFuncInvocationsData,
      hasNoData: funcInvocationsData?.hasNoData ?? false,
    },
    [PricingMetric.REALTIME_MESSAGE_COUNT]: {
      data: realtimeMessagesData?.data ?? [],
      margin: 38,
      isLoading: isLoadingRealtimeMessagesData,
      hasNoData: realtimeMessagesData?.hasNoData ?? false,
    },
    [PricingMetric.REALTIME_PEAK_CONNECTIONS]: {
      data: realtimeConnectionsData?.data ?? [],
      margin: 0,
      isLoading: isLoadingRealtimeConnectionsData,
      hasNoData: realtimeConnectionsData?.hasNoData ?? false,
    },
  }

  return (
    <UsageSection
      orgSlug={orgSlug}
      categoryKey="activity"
      chartMeta={chartMeta}
      subscription={subscription}
      currentBillingCycleSelected={currentBillingCycleSelected}
    />
  )
}

export default Activity
