import type { ProjectDailyStatsAttribute } from './project-daily-stats-query'
import { useProjectDailyStatsQuery } from './project-daily-stats-query'

export function useProjectDailyStatsQueries(
  attributes: ProjectDailyStatsAttribute[],
  ref: string | string[] | undefined,
  startDate: string,
  endDate: string,
  data: any,
  isVisible: boolean
) {
  return attributes.map((attribute) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useProjectDailyStatsQuery(
      {
        projectRef: ref as string,
        attribute,
        startDate,
        endDate,
      },
      { enabled: data === undefined && isVisible }
    )
  )
}
