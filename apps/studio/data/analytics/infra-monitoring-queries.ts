import { useInfraMonitoringQuery } from './infra-monitoring-query'
import type { InfraMonitoringAttribute } from './infra-monitoring-query'
import { AnalyticsInterval } from './constants'

export function useInfraMonitoringQueries(
  attributes: InfraMonitoringAttribute[],
  ref: string | string[] | undefined,
  startDate: string,
  endDate: string,
  interval: AnalyticsInterval,
  databaseIdentifier: string | undefined,
  data: any,
  isVisible: boolean
) {
  return attributes.map((attribute) =>
    useInfraMonitoringQuery(
      {
        projectRef: ref as string,
        attribute,
        startDate,
        endDate,
        interval,
        databaseIdentifier,
      },
      { enabled: data === undefined && isVisible }
    )
  )
}
