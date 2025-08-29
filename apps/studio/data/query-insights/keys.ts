import type { QueryKey } from '@tanstack/react-query'

export const queryInsightsKeys = {
  all: (projectRef: string | undefined) => ['projects', projectRef, 'query-insights'] as const,
  metrics: (projectRef: string | undefined, metric: string, startTime: string, endTime: string) =>
    ['projects', projectRef, 'query-insights', 'metrics', metric, startTime, endTime] as const,
  queries: (projectRef: string | undefined, startTime: string, endTime: string) =>
    ['projects', projectRef, 'query-insights', 'queries', startTime, endTime] as const,
  queriesWithErrors: (projectRef: string | undefined, startTime: string, endTime: string) =>
    ['projects', projectRef, 'query-insights', 'queries-with-errors', startTime, endTime] as const,
  glance: (projectRef: string | undefined, startTime: string, endTime: string) =>
    ['projects', projectRef, 'query-insights', 'glance', startTime, endTime] as const,
}