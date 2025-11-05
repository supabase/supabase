import { AnalyticsInterval } from './constants'
import type { InfraMonitoringAttribute } from './infra-monitoring-query'
import { useInfraMonitoringQuery } from './infra-monitoring-query'

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
    // eslint-disable-next-line react-hooks/rules-of-hooks
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
