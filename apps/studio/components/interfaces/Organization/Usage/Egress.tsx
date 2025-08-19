import { DataPoint } from 'data/analytics/constants'
import { PricingMetric, useOrgDailyStatsQuery } from 'data/analytics/org-daily-stats-query'
import type { OrgSubscription } from 'data/subscriptions/types'
import UsageSection from './UsageSection/UsageSection'

export interface EgressProps {
  orgSlug: string
  projectRef?: string
  startDate: string | undefined
  endDate: string | undefined
  subscription: OrgSubscription | undefined
  currentBillingCycleSelected: boolean
}

const Egress = ({
  orgSlug,
  projectRef,
  subscription,
  startDate,
  endDate,
  currentBillingCycleSelected,
}: EgressProps) => {
  const { data: egressData, isLoading: isLoadingDbEgressData } = useOrgDailyStatsQuery({
    orgSlug,
    projectRef,
    metric: PricingMetric.EGRESS,
    interval: '1d',
    startDate,
    endDate,
  })

  const { data: cachedEgressData, isLoading: isLoadingCachedEgress } = useOrgDailyStatsQuery({
    orgSlug,
    projectRef,
    metric: PricingMetric.CACHED_EGRESS,
    interval: '1d',
    startDate,
    endDate,
  })

  const chartMeta: {
    [key: string]: { data: DataPoint[]; margin: number; isLoading: boolean }
  } = {
    [PricingMetric.EGRESS]: {
      data: egressData?.data ?? [],
      margin: 16,
      isLoading: isLoadingDbEgressData,
    },
    [PricingMetric.CACHED_EGRESS]: {
      data: cachedEgressData?.data ?? [],
      margin: 16,
      isLoading: isLoadingCachedEgress,
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
    />
  )
}

export default Egress
