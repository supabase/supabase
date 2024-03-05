import { DataPoint } from 'data/analytics/constants'
import { PricingMetric, useOrgDailyStatsQuery } from 'data/analytics/org-daily-stats-query'
import type { OrgSubscription } from 'data/subscriptions/types'
import UsageSection from './UsageSection/UsageSection'

export interface BandwidthProps {
  orgSlug: string
  projectRef?: string
  startDate: string | undefined
  endDate: string | undefined
  subscription: OrgSubscription | undefined
  currentBillingCycleSelected: boolean
}

const Bandwidth = ({
  orgSlug,
  projectRef,
  subscription,
  startDate,
  endDate,
  currentBillingCycleSelected,
}: BandwidthProps) => {
  const { data: egressData, isLoading: isLoadingDbEgressData } = useOrgDailyStatsQuery({
    orgSlug,
    projectRef,
    metric: PricingMetric.EGRESS,
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
  }

  return (
    <UsageSection
      orgSlug={orgSlug}
      projectRef={projectRef}
      categoryKey="bandwidth"
      chartMeta={chartMeta}
      subscription={subscription}
      currentBillingCycleSelected={currentBillingCycleSelected}
    />
  )
}

export default Bandwidth
