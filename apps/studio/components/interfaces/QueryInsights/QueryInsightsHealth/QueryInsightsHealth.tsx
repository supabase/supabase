import { useQueryInsightsIssues } from '../hooks/useQueryInsightsIssues'
import { useQueryInsightsScore } from '../hooks/useQueryInsightsScore'
import { useQueryInsightsMetrics } from '../hooks/useQueryInsightsMetrics'
import { HEALTH_COLORS, HEALTH_LEVELS } from './QueryInsightsHealth.constants'
import type { QueryPerformanceRow } from '../../QueryPerformance/QueryPerformance.types'
import { QueryInsightsHealthMetric } from './QueryInsightsHealthMetric'

interface QueryInsightsHealthProps {
  data: QueryPerformanceRow[]
  isLoading: boolean
}

export const QueryInsightsHealth = ({ data, isLoading }: QueryInsightsHealthProps) => {
  const { errors, indexIssues, slowQueries } = useQueryInsightsIssues(data)
  const { score, level } = useQueryInsightsScore({ errors, indexIssues, slowQueries })
  const { avgP95, totalCalls, totalRowsRead, cacheHitRate } = useQueryInsightsMetrics(data)

  const color = HEALTH_COLORS[level]
  const label = HEALTH_LEVELS[level].label

  return (
    <div className="w-full border-b flex items-center">
      <div className="px-6 py-3 flex items-center gap-3">
        {isLoading ? (
          <>
            <div className="h-12 w-12 rounded-full bg-surface-300 animate-pulse" />
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-20 rounded bg-surface-300 animate-pulse" />
              <div className="h-5 w-24 rounded bg-surface-300 animate-pulse" />
            </div>
          </>
        ) : (
          <>
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center"
              style={{
                background: `conic-gradient(${color} ${score * 3.6}deg, hsl(var(--border-default)) ${score * 3.6}deg)`,
              }}
            >
              <div
                className="h-10 w-10 rounded-full bg-studio flex items-center justify-center text-base font-medium"
                style={{ color }}
              >
                {score}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-foreground-lighter uppercase font-mono tracking-wider">
                Health Score
              </span>
              <span className="text-xl text-foreground-light" style={{ color }}>
                {label}
              </span>
            </div>
          </>
        )}
      </div>
      <div className="flex-1 border-l h-full">
        <div className="grid grid-cols-2">
          <QueryInsightsHealthMetric
            label="Average P95"
            value={`${avgP95}ms`}
            className="border-b"
            isLoading={isLoading}
          />
          <QueryInsightsHealthMetric
            label="Total Calls"
            value={totalCalls.toLocaleString()}
            className="border-l border-b"
            isLoading={isLoading}
          />
          <QueryInsightsHealthMetric
            label="Total Rows Read"
            value={totalRowsRead.toLocaleString()}
            isLoading={isLoading}
          />
          <QueryInsightsHealthMetric
            label="Cache Hit Rate"
            value={cacheHitRate}
            className="border-l"
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
