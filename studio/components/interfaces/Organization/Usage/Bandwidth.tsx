import { DataPoint } from 'data/analytics/constants'
import { PricingMetric, useOrgDailyStatsQuery } from 'data/analytics/org-daily-stats-query'
import { ProjectSubscriptionResponse } from 'data/subscriptions/project-subscription-v2-query'
import UsageSection from './UsageSection/UsageSection'

const GB = 1073741824

// [Joshen] Can remove this at the end
const MOCK_DATA_2 = [
  {
    period_start: '2023-06-01',
    egress: 8678929619,
    egress_database: 7283483597,
    egress_auth: 435216776,
    egress_storage: 481432155,
    egress_realtime: 478797091,
  },
  {
    period_start: '2023-06-02',
    egress: 6446889468,
    egress_database: 5284341572,
    egress_auth: 425272306,
    egress_storage: 368536397,
    egress_realtime: 368739193,
  },
  {
    period_start: '2023-06-03',
    egress: 7940650326,
    egress_database: 6743975946,
    egress_auth: 359361673,
    egress_storage: 351855389,
    egress_realtime: 485457318,
  },
  {
    period_start: '2023-06-04',
    egress: 7595077017,
    egress_database: 6654607743,
    egress_auth: 308779823,
    egress_storage: 139644836,
    egress_realtime: 492044615,
  },
  {
    period_start: '2023-06-05',
    egress: 7830613275,
    egress_database: 6957932956,
    egress_auth: 475208724,
    egress_storage: 123853608,
    egress_realtime: 273617987,
  },
  {
    period_start: '2023-06-06',
    egress: 6361397604,
    egress_database: 5219239997,
    egress_auth: 371950767,
    egress_storage: 477655193,
    egress_realtime: 292551647,
  },
  {
    period_start: '2023-06-07',
    egress: 8119115718,
    egress_database: 7060114070,
    egress_auth: 402873931,
    egress_storage: 286106674,
    egress_realtime: 370021043,
  },
  {
    period_start: '2023-06-08',
    egress: 9354738273,
    egress_database: 8209195125,
    egress_auth: 205419959,
    egress_storage: 456027425,
    egress_realtime: 484095764,
  },
  {
    period_start: '2023-06-09',
    egress: 10204993748,
    egress_database: 9166932029,
    egress_auth: 449361248,
    egress_storage: 307493054,
    egress_realtime: 281207417,
  },
  {
    period_start: '2023-06-10',
    egress: 8838625357,
    egress_database: 7895700317,
    egress_auth: 297427767,
    egress_storage: 284882171,
    egress_realtime: 360615102,
  },
  {
    period_start: '2023-06-11',
    egress: 7543652486,
    egress_database: 6750703440,
    egress_auth: 305554257,
    egress_storage: 236963257,
    egress_realtime: 250431532,
  },
  {
    period_start: '2023-06-12',
    egress: 9086498661,
    egress_database: 7866207720,
    egress_auth: 389609413,
    egress_storage: 402935419,
    egress_realtime: 427746109,
  },
  {
    period_start: '2023-06-13',
    egress: 10121072311,
    egress_database: 9003849634,
    egress_auth: 234444930,
    egress_storage: 498282627,
    egress_realtime: 384495120,
  },
  {
    period_start: '2023-06-14',
    egress: 10137754419,
    egress_database: 9236420539,
    egress_auth: 244698555,
    egress_storage: 184916493,
    egress_realtime: 471718832,
  },
  {
    period_start: '2023-06-15',
    egress: 9388496424,
    egress_database: 8444365130,
    egress_auth: 375347308,
    egress_storage: 157868811,
    egress_realtime: 410915175,
  },
  {
    period_start: '2023-06-16',
    egress: 10115543729,
    egress_database: 9127516223,
    egress_auth: 284643497,
    egress_storage: 415070455,
    egress_realtime: 288313554,
  },
  {
    period_start: '2023-06-17',
    egress: 6269152878,
    egress_database: 5190467136,
    egress_auth: 479372335,
    egress_storage: 262200598,
    egress_realtime: 337112809,
  },
  {
    period_start: '2023-06-18',
    egress: 8140229692,
    egress_database: 7068203737,
    egress_auth: 371277477,
    egress_storage: 281662911,
    egress_realtime: 419085567,
  },
  {
    period_start: '2023-06-19',
    egress: 9962259043,
    egress_database: 8764804798,
    egress_auth: 459538891,
    egress_storage: 443083594,
    egress_realtime: 294831760,
  },
  {
    period_start: '2023-06-20',
    egress: 6781133823,
    egress_database: 6100566484,
    egress_auth: 234685038,
    egress_storage: 216755352,
    egress_realtime: 229126949,
  },
  {
    period_start: '2023-06-21',
    egress: 10907104106,
    egress_database: 9828947491,
    egress_auth: 242570435,
    egress_storage: 387368954,
    egress_realtime: 448217226,
  },
  {
    period_start: '2023-06-22',
    egress: 7074396542,
    egress_database: 6144364141,
    egress_auth: 436239765,
    egress_storage: 231784945,
    egress_realtime: 262007691,
  },
  {
    period_start: '2023-06-23',
    egress: 7464749639,
    egress_database: 6594269898,
    egress_auth: 263127587,
    egress_storage: 272203780,
    egress_realtime: 335148374,
  },
  {
    period_start: '2023-06-24',
    egress: 9288513914,
    egress_database: 8401011152,
    egress_auth: 362579381,
    egress_storage: 167061172,
    egress_realtime: 357862209,
  },
  {
    period_start: '2023-06-25',
    egress: 7361708068,
    egress_database: 6415122839,
    egress_auth: 234278289,
    egress_storage: 466094668,
    egress_realtime: 246212272,
  },
  {
    period_start: '2023-06-26',
    egress: 6789453179,
    egress_database: 5618461937,
    egress_auth: 479805982,
    egress_storage: 301891269,
    egress_realtime: 389293991,
  },
]

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
    [key: string]: { data: DataPoint[]; margin: number; isLoading: boolean; hasNoData: boolean }
  } = {
    [PricingMetric.EGRESS]: {
      data: egressData?.data ?? [],
      margin: 16,
      isLoading: isLoadingDbEgressData,
      hasNoData: egressData?.hasNoData ?? false,
    },
  }

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
