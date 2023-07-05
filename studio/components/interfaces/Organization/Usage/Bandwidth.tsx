import { DataPoint } from 'data/analytics/constants'
import { useDailyStatsQuery } from 'data/analytics/daily-stats-query'
import { ProjectSubscriptionResponse } from 'data/subscriptions/project-subscription-v2-query'
import UsageSection from './UsageSection'

const GB = 1073741824
const MOCK_DATA = [
  {
    id: '1',
    loopId: '1',
    period_start: '2023-06-29T07:05:12Z',
    periodStartFormatted: '29 Jun 2023',
    total_storage_egress: (1.53 * GB).toString(),
    total_egress_modified: (1.12 * GB).toString(),
  },
  {
    id: '2',
    loopId: '2',
    period_start: '2023-06-30T07:05:12Z',
    periodStartFormatted: '30 Jun 2023',
    total_storage_egress: (1 * GB).toString(),
    total_egress_modified: (1.1 * GB).toString(),
  },
  {
    id: '3',
    loopId: '3',
    period_start: '2023-07-01T07:05:12Z',
    periodStartFormatted: '01 Jul 2023',
    total_storage_egress: (1 * GB).toString(),
    total_egress_modified: (1.2 * GB).toString(),
  },
  {
    id: '4',
    loopId: '4',
    period_start: '2023-07-02T07:05:12Z',
    periodStartFormatted: '02 Jul 2023',
    total_storage_egress: (1 * GB).toString(),
    total_egress_modified: (1.5 * GB).toString(),
  },
  {
    id: '5',
    loopId: '5',
    period_start: '2023-07-03T07:05:12Z',
    periodStartFormatted: '03 Jul 2023',
    total_storage_egress: (1 * GB).toString(),
    total_egress_modified: (2 * GB).toString(),
  },
  {
    id: '6',
    loopId: '6',
    period_start: '2023-07-04T07:05:12Z',
    periodStartFormatted: '04 Jul 2023',
    total_storage_egress: (1 * GB).toString(),
    total_egress_modified: (3 * GB).toString(),
  },
  {
    id: '7',
    loopId: '7',
    period_start: '2023-07-05T07:05:12Z',
    periodStartFormatted: '05 Jul 2023',
    total_storage_egress: (1 * GB).toString(),
    total_egress_modified: (4.5 * GB).toString(),
  },
  {
    id: '8',
    loopId: '8',
    period_start: '2023-07-06T07:05:12Z',
    periodStartFormatted: '06 Jul 2023',
    total_storage_egress: (1 * GB).toString(),
    total_egress_modified: (4 * GB).toString(),
  },
  {
    id: '9',
    loopId: '9',
    period_start: '2023-07-07T07:05:12Z',
    periodStartFormatted: '07 Jul 2023',
    total_storage_egress: (1 * GB).toString(),
    total_egress_modified: (3.8 * GB).toString(),
  },
  {
    id: '10',
    loopId: '10',
    period_start: '2023-07-08T07:05:12Z',
    periodStartFormatted: '08 Jul 2023',
    total_storage_egress: (1 * GB).toString(),
    total_egress_modified: (3.5 * GB).toString(),
  },
]

export interface BandwidthProps {
  projectRef: string
  startDate: string | undefined
  endDate: string | undefined
  subscription: ProjectSubscriptionResponse | undefined
  currentBillingCycleSelected: boolean
}

// [Joshen TODO] Needs to take in org slug and eventually use daily stats org query
const Bandwidth = ({
  projectRef,
  subscription,
  startDate,
  endDate,
  currentBillingCycleSelected,
}: BandwidthProps) => {
  // const { data: dbEgressData, isLoading: isLoadingDbEgressData } = useDailyStatsQuery({
  //   projectRef,
  //   attribute: 'total_egress_modified',
  //   interval: '1d',
  //   startDate,
  //   endDate,
  // })

  const chartMeta: {
    [key: string]: { data: DataPoint[]; margin: number; isLoading: boolean; hasNoData: boolean }
  } = {
    db_egress: {
      data: MOCK_DATA, // dbEgressData?.data ?? [],
      margin: 16,
      isLoading: false, // isLoadingDbEgressData,
      hasNoData: false, // dbEgressData?.hasNoData ?? false,
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
