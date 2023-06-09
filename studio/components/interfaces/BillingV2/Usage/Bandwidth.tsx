import { DataPoint } from 'data/analytics/constants'
import { useDailyStatsQuery } from 'data/analytics/daily-stats-query'
import { ProjectSubscriptionResponse } from 'data/subscriptions/project-subscription-v2-query'
import UsageSection from './UsageSection'

export interface BandwidthProps {
  projectRef: string
  startDate: string | undefined
  endDate: string | undefined
  subscription: ProjectSubscriptionResponse | undefined
  currentBillingCycleSelected: boolean
}

const Bandwidth = ({
  projectRef,
  subscription,
  startDate,
  endDate,
  currentBillingCycleSelected,
}: BandwidthProps) => {
  const { data: dbEgressData, isLoading: isLoadingDbEgressData } = useDailyStatsQuery({
    projectRef,
    attribute: 'total_egress_modified',
    interval: '1d',
    startDate,
    endDate,
  })

  const { data: storageEgressData, isLoading: isLoadingStorageEgressData } = useDailyStatsQuery({
    projectRef,
    attribute: 'total_storage_egress',
    interval: '1d',
    startDate,
    endDate,
  })

  const chartMeta: {
    [key: string]: { data: DataPoint[]; margin: number; isLoading: boolean; hasNoData: boolean }
  } = {
    db_egress: {
      data: dbEgressData?.data ?? [],
      margin: 16,
      isLoading: isLoadingDbEgressData,
      hasNoData: dbEgressData?.hasNoData ?? false,
    },
    storage_egress: {
      data: storageEgressData?.data ?? [],
      margin: 14,
      isLoading: isLoadingStorageEgressData,
      hasNoData: storageEgressData?.hasNoData ?? false,
    },
  }

  return (
    <UsageSection
      projectRef={projectRef}
      categoryKey="bandwidth"
      chartMeta={chartMeta}
      subscription={subscription}
      currentBillingCycleSelected={currentBillingCycleSelected}
    />
  )
}

export default Bandwidth
