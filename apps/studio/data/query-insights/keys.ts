import { useParams } from 'common'

export const queryInsightsKeys = {
  metrics: (projectRef: string | undefined, metric: string, startTime: string, endTime: string) =>
    ['query-insights', 'metrics', projectRef, metric, startTime, endTime] as const,
  queries: (projectRef: string | undefined, startTime: string, endTime: string) =>
    ['query-insights', 'queries', projectRef, startTime, endTime] as const,
}
