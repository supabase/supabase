import { useQueryClient } from '@tanstack/react-query'
import { analyticsKeys } from './keys'

export const useInvalidateAnalyticsQuery = () => {
  const queryClient = useQueryClient()

  const invalidateInfraMonitoringQuery = (
    ref: string,
    {
      attribute,
      startDate,
      endDate,
      interval,
      databaseIdentifier,
    }: {
      attribute?: string
      startDate?: string
      endDate?: string
      interval?: string
      databaseIdentifier?: string
    }
  ) => {
    queryClient.invalidateQueries({
      queryKey: analyticsKeys.infraMonitoring(ref, {
        attribute,
        startDate,
        endDate,
        interval,
        databaseIdentifier,
      }),
    })
  }

  return { invalidateInfraMonitoringQuery }
}
