import { useDailyStatsQuery } from 'data/analytics/daily-stats-query'
import { USAGE_CATEGORIES } from './Usage.constants'
import { DataPoint } from 'data/analytics/constants'
import { ProjectSubscriptionResponse } from 'data/subscriptions/project-subscription-v2-query'
import UsageFoo from './UsageFoo'

export interface SizeAndCountsProps {
  projectRef: string
  startDate: string | undefined
  endDate: string | undefined
  subscription: ProjectSubscriptionResponse | undefined
}

const SizeAndCounts = ({ projectRef, startDate, endDate, subscription }: SizeAndCountsProps) => {
  const categoryMeta = USAGE_CATEGORIES.find((category) => category.key === 'sizeCount')

  const { data: dbSizeData, isLoading: isLoadingDbSizeData } = useDailyStatsQuery({
    projectRef,
    attribute: 'total_db_size_bytes',
    interval: '1d',
    startDate,
    endDate,
  })

  const { data: storageSizeData, isLoading: isLoadingStorageSizeData } = useDailyStatsQuery({
    projectRef,
    attribute: 'total_storage_size_bytes',
    interval: '1d',
    startDate,
    endDate,
  })

  const { data: functionCountData, isLoading: isLoadingFunctionCountData } = useDailyStatsQuery({
    projectRef,
    attribute: 'total_func_count',
    interval: '1d',
    startDate,
    endDate,
  })

  const chartMeta: {
    [key: string]: { data: DataPoint[]; margin: number; isLoading: boolean; hasNoData: boolean }
  } = {
    db_size: {
      isLoading: isLoadingDbSizeData,
      margin: 14,
      data: dbSizeData?.data ?? [],
      hasNoData: dbSizeData?.hasNoData ?? false,
    },
    storage_size: {
      isLoading: isLoadingStorageSizeData,
      margin: 14,
      data: storageSizeData?.data ?? [],
      hasNoData: storageSizeData?.hasNoData ?? false,
    },
    func_count: {
      isLoading: isLoadingFunctionCountData,
      margin: 0,
      data: functionCountData?.data ?? [],
      hasNoData: functionCountData?.hasNoData ?? false,
    },
  }

  if (categoryMeta === undefined) return null

  return (
    <UsageFoo
      projectRef={projectRef}
      categoryMeta={categoryMeta}
      chartMeta={chartMeta}
      subscription={subscription}
    />
  )
}

export default SizeAndCounts
