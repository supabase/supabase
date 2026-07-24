import { useParams } from 'common'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import {
  Activity,
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
  ContributionGraphFooter,
  ContributionGraphLegend,
} from './ContributionGraph'
import { SEARCH_PARAMS_PARSER } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.constants'
import { QuerySearchParamsType } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.types'
import { useUnifiedLogsChartQuery } from '@/data/logs/unified-logs-chart-query'

const ACTIVITY_DAYS = 90

// Every SEARCH_PARAMS_PARSER key parsed with no URL value, giving the same
// defaults the Logs Explorer itself falls back to (sort, size, cursor, etc).
const BASE_SEARCH = Object.fromEntries(
  Object.entries(SEARCH_PARAMS_PARSER).map(([key, parser]) => [
    key,
    parser.parseServerSide(undefined),
  ])
) as QuerySearchParamsType

const countToLevel = (count: number) => {
  if (count === 0) return 0
  if (count < 3) return 1
  if (count < 6) return 2
  if (count < 12) return 3
  return 4
}

export const UserActivityGraph = ({ userId }: { userId: string }) => {
  const { ref: projectRef } = useParams()

  const search: QuerySearchParamsType = useMemo(
    () => ({
      ...BASE_SEARCH,
      date: [
        dayjs
          .utc()
          .subtract(ACTIVITY_DAYS - 1, 'day')
          .startOf('day')
          .toDate(),
        dayjs.utc().endOf('day').toDate(),
      ],
      user: userId,
      filter: ['log_type:eq:auth'],
    }),
    [userId]
  )

  const { data: chartData, isLoading } = useUnifiedLogsChartQuery({ projectRef, search })

  const data: Activity[] = useMemo(() => {
    if (!chartData) {
      return Array.from({ length: ACTIVITY_DAYS }, (_, i) => ({
        date: dayjs
          .utc()
          .subtract(ACTIVITY_DAYS - 1 - i, 'day')
          .format('YYYY-MM-DD'),
        count: 0,
        level: 0,
      }))
    }

    return chartData.map((point) => {
      const count = point.success + point.warning + point.error
      return {
        date: dayjs.utc(point.timestamp).format('YYYY-MM-DD'),
        count,
        level: countToLevel(count),
      }
    })
  }, [chartData])

  return (
    <ContributionGraph data={data} className="w-full pt-2" blockMargin={4} blockSize={25}>
      <ContributionGraphCalendar>
        {({ activity, dayIndex, weekIndex }) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <g>
                <ContributionGraphBlock
                  activity={activity}
                  className={cn(
                    'data-[level="0"]:fill-green-100',
                    'data-[level="1"]:fill-green-300',
                    'data-[level="2"]:fill-green-500',
                    'data-[level="3"]:fill-green-700',
                    'data-[level="4"]:fill-green-900',
                    isLoading && 'animate-pulse data-[level="0"]:fill-green-700'
                  )}
                  style={{ animationDelay: `${weekIndex * 80}ms` }}
                  dayIndex={dayIndex}
                  weekIndex={weekIndex}
                />
              </g>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-semibold">{activity.date}</p>
              <p>
                {activity.count} auth event{activity.count === 1 ? '' : 's'}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </ContributionGraphCalendar>
    </ContributionGraph>
  )
}
