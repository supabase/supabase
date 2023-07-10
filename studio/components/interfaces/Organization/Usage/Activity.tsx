import { DataPoint } from 'data/analytics/constants'
import { PricingMetric, useOrgDailyStatsQuery } from 'data/analytics/org-daily-stats-query'
import { OrgSubscription } from 'data/subscriptions/org-subscription-query'
import UsageSection from './UsageSection/UsageSection'

export interface ActivityProps {
  orgSlug: string
  projectRef?: string
  startDate: string | undefined
  endDate: string | undefined
  subscription: OrgSubscription | undefined
  currentBillingCycleSelected: boolean
}

const Activity = ({
  orgSlug,
  projectRef,
  subscription,
  startDate,
  endDate,
  currentBillingCycleSelected,
}: ActivityProps) => {
  const { data: mauData, isLoading: isLoadingMauData } = useOrgDailyStatsQuery({
    orgSlug,
    projectRef,
    metric: PricingMetric.MONTHLY_ACTIVE_USERS,
    interval: '1d',
    startDate,
    endDate,
  })

  const { data: mauSSOData, isLoading: isLoadingMauSSOData } = useOrgDailyStatsQuery({
    orgSlug,
    projectRef,
    metric: PricingMetric.MONTHLY_ACTIVE_SSO_USERS,
    interval: '1d',
    startDate,
    endDate,
  })

  const { data: assetTransformationsData, isLoading: isLoadingAssetTransformationsData } =
    useOrgDailyStatsQuery({
      orgSlug,
      projectRef,
      metric: PricingMetric.STORAGE_IMAGES_TRANSFORMED,
      interval: '1d',
      startDate,
      endDate,
    })

  const { data: funcInvocationsData, isLoading: isLoadingFuncInvocationsData } =
    useOrgDailyStatsQuery({
      orgSlug,
      projectRef,
      metric: PricingMetric.FUNCTION_INVOCATIONS,
      interval: '1d',
      startDate,
      endDate,
    })

  const { data: realtimeMessagesData, isLoading: isLoadingRealtimeMessagesData } =
    useOrgDailyStatsQuery({
      orgSlug,
      projectRef,
      metric: PricingMetric.REALTIME_MESSAGE_COUNT,
      interval: '1d',
      startDate,
      endDate,
    })

  const { data: realtimeConnectionsData, isLoading: isLoadingRealtimeConnectionsData } =
    useOrgDailyStatsQuery({
      orgSlug,
      projectRef,
      metric: PricingMetric.REALTIME_PEAK_CONNECTIONS,
      interval: '1d',
      startDate,
      endDate,
    })

  const chartMeta: {
    [key: string]: { data: DataPoint[]; margin: number; isLoading: boolean }
  } = {
    [PricingMetric.MONTHLY_ACTIVE_USERS]: {
      data: mauData?.data ?? [],
      margin: 18,
      isLoading: isLoadingMauData,
    },
    [PricingMetric.MONTHLY_ACTIVE_SSO_USERS]: {
      data: mauSSOData?.data ?? [],
      margin: 20,
      isLoading: isLoadingMauSSOData,
    },
    [PricingMetric.STORAGE_IMAGES_TRANSFORMED]: {
      data: assetTransformationsData?.data ?? [],
      margin: 0,
      isLoading: isLoadingAssetTransformationsData,
    },
    [PricingMetric.FUNCTION_INVOCATIONS]: {
      data: funcInvocationsData?.data ?? [],
      margin: 26,
      isLoading: isLoadingFuncInvocationsData,
    },
    [PricingMetric.REALTIME_MESSAGE_COUNT]: {
      data: realtimeMessagesData?.data ?? [],
      margin: 38,
      isLoading: isLoadingRealtimeMessagesData,
    },
    [PricingMetric.REALTIME_PEAK_CONNECTIONS]: {
      data: realtimeConnectionsData?.data ?? [],
      margin: 0,
      isLoading: isLoadingRealtimeConnectionsData,
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
