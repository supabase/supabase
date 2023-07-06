import { DataPoint } from 'data/analytics/constants'
import { PricingMetric, useOrgDailyStatsQuery } from 'data/analytics/org-daily-stats-query'
import { ProjectSubscriptionResponse } from 'data/subscriptions/project-subscription-v2-query'
import UsageSection from './UsageSection/UsageSection'

export interface BandwidthProps {
  orgSlug: string
  startDate: string | undefined
  endDate: string | undefined
  subscription: ProjectSubscriptionResponse | undefined
  currentBillingCycleSelected: boolean
}

// [Joshen TODO] Needs to take in org slug and eventually use daily stats org query
const Bandwidth = ({
  orgSlug,
  subscription,
  startDate,
  endDate,
  currentBillingCycleSelected,
}: BandwidthProps) => {
  const { data: egressData, isLoading: isLoadingDbEgressData } = useOrgDailyStatsQuery({
    orgSlug,
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

  console.log(egressData)

  return (
    <UsageSection
      orgSlug={orgSlug}
      categoryKey="bandwidth"
      chartMeta={chartMeta}
      subscription={subscription}
      currentBillingCycleSelected={currentBillingCycleSelected}
    />
  )
}

export default Bandwidth
