import { useFlag } from 'common'

import { shouldShowDiskIOBurstBalanceChart } from '@/data/reports/database-charts'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const useShowDiskIOBurstBalanceChart = (): boolean => {
  const isFlagEnabled = useFlag('showDiskIOBurstBalanceChart')
  const { data: project } = useSelectedProjectQuery()
  return shouldShowDiskIOBurstBalanceChart(project, !!isFlagEnabled)
}
