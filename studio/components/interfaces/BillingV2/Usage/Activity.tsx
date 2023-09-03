import { useDailyStatsQuery } from 'data/analytics/daily-stats-query'
import { DataPoint } from 'data/analytics/constants'
import { ProjectSubscriptionResponse } from 'data/subscriptions/project-subscription-v2-query'
import UsageSection from './UsageSection'

export interface ActivityProps {
  projectRef: string
  startDate: string | undefined
  endDate: string | undefined
  subscription: ProjectSubscriptionResponse | undefined
  currentBillingCycleSelected: boolean
}

const Activity = ({
  projectRef,
  subscription,
  startDate,
  endDate,
  currentBillingCycleSelected,
}: ActivityProps) => {
  const { data: mauData, isLoading: isLoadingMauData } = useDailyStatsQuery({
    projectRef,
    attribute: 'total_auth_billing_period_mau',
    interval: '1d',
    startDate,
    endDate,
  })

  const { data: mauSSOData, isLoading: isLoadingMauSSOData } = useDailyStatsQuery({
    projectRef,
    attribute: 'total_auth_billing_period_sso_mau',
    interval: '1d',
    startDate,
    endDate,
  })

  const { data: assetTransformationsData, isLoading: isLoadingAssetTransformationsData } =
    useDailyStatsQuery({
      projectRef,
      attribute: 'total_storage_image_render_count',
      interval: '1d',
      startDate,
      endDate,
    })

  const { data: funcInvocationsData, isLoading: isLoadingFuncInvocationsData } = useDailyStatsQuery(
    {
      projectRef,
      attribute: 'total_func_invocations',
      interval: '1d',
      startDate,
      endDate,
    }
  )

  const { data: realtimeMessagesData, isLoading: isLoadingRealtimeMessagesData } =
    useDailyStatsQuery({
      projectRef,
      attribute: 'total_realtime_message_count',
      interval: '1d',
      startDate,
      endDate,
    })

  const { data: realtimeConnectionsData, isLoading: isLoadingRealtimeConnectionsData } =
    useDailyStatsQuery({
      projectRef,
      attribute: 'total_realtime_peak_connection',
      interval: '1d',
      startDate,
      endDate,
    })

  const chartMeta: {
    [key: string]: { data: DataPoint[]; margin: number; isLoading: boolean; hasNoData: boolean }
  } = {
    monthly_active_users: {
      data: mauData?.data ?? [],
      margin: 18,
      isLoading: isLoadingMauData,
      hasNoData: mauData?.hasNoData ?? false,
    },
    monthly_active_sso_users: {
      data: mauSSOData?.data ?? [],
      margin: 20,
      isLoading: isLoadingMauSSOData,
      hasNoData: mauSSOData?.hasNoData ?? false,
    },
    storage_image_render_count: {
      data: assetTransformationsData?.data ?? [],
      margin: 0,
      isLoading: isLoadingMauSSOData,
      hasNoData: assetTransformationsData?.hasNoData ?? false,
    },
    func_invocations: {
      data: funcInvocationsData?.data ?? [],
      margin: 26,
      isLoading: isLoadingFuncInvocationsData,
      hasNoData: funcInvocationsData?.hasNoData ?? false,
    },
    realtime_message_count: {
      data: realtimeMessagesData?.data ?? [],
      margin: 38,
      isLoading: isLoadingRealtimeMessagesData,
      hasNoData: realtimeMessagesData?.hasNoData ?? false,
    },
    realtime_peak_connection: {
      data: realtimeConnectionsData?.data ?? [],
      margin: 0,
      isLoading: isLoadingRealtimeConnectionsData,
      hasNoData: realtimeConnectionsData?.hasNoData ?? false,
    },
  }

  return (
    <UsageSection
      projectRef={projectRef}
      categoryKey="activity"
      chartMeta={chartMeta}
      subscription={subscription}
      currentBillingCycleSelected={currentBillingCycleSelected}
    />
  )
}

export default Activity
