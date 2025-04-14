import { useProjectDailyStatsQuery } from './project-daily-stats-query'
import type { ProjectDailyStatsAttribute } from './project-daily-stats-query'
import { AnalyticsInterval } from './constants'

export function useProjectDailyStatsQueries(
  attributes: ProjectDailyStatsAttribute[],
  ref: string | string[] | undefined,
  startDate: string,
  endDate: string,
  interval: AnalyticsInterval,
  databaseIdentifier: string | undefined,
  data: any,
  isVisible: boolean
) {
  return attributes.map((attribute) =>
    useProjectDailyStatsQuery(
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
