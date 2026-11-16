import { useFlag } from 'common'

import { shouldShowDiskIOBurstBalanceChart } from '@/data/reports/database-charts'
import { useProjectDiskLimits } from '@/hooks/misc/useProjectDiskLimits'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const useShowDiskIOBurstBalanceChart = (): boolean => {
  const isFlagEnabled = useFlag('showDiskIOBurstBalanceChart')
  const { data: project } = useSelectedProjectQuery()
  const { limits } = useProjectDiskLimits()
  return shouldShowDiskIOBurstBalanceChart(project, !!isFlagEnabled, limits)
}
