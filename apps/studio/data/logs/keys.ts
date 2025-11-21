import { QuerySearchParamsType } from 'components/interfaces/UnifiedLogs/UnifiedLogs.types'

export const logsKeys = {
  unifiedLogsInfinite: (
    projectRef: string | undefined,
    searchParams: QuerySearchParamsType | undefined
  ) =>
    [
      'projects',
      projectRef,
      'unified-logs',
      'logs-data',
      ...(searchParams ? [searchParams].filter(Boolean) : []),
    ] as const,
  unifiedLogsCount: (
    projectRef: string | undefined,
    searchParams: QuerySearchParamsType | undefined
  ) =>
    [
      'projects',
      projectRef,
      'unified-logs',
      'count-data',
      ...(searchParams ? [searchParams].filter(Boolean) : []),
    ] as const,
  unifiedLogsChart: (
    projectRef: string | undefined,
    searchParams: QuerySearchParamsType | undefined
  ) =>
    [
      'projects',
      projectRef,
      'unified-logs',
      'chart-data',
      ...(searchParams ? [searchParams].filter(Boolean) : []),
    ] as const,
  unifiedLogsFacetCount: (
    projectRef: string | undefined,
    facet: string,
    facetSearch: string | undefined,
    searchParams: QuerySearchParamsType | undefined
  ) =>
    [
      'projects',
      projectRef,
      'unified-logs',
      'count-data',
      facet,
      facetSearch,
      ...(searchParams ? [searchParams].filter(Boolean) : []),
    ] as const,
  serviceFlow: (
    projectRef: string | undefined,
    searchParams: QuerySearchParamsType | undefined,
    logId: string | undefined
  ) =>
    [
      'projects',
      projectRef,
      'unified-logs',
      'service-flow',
      logId,
      ...(searchParams ? [searchParams].filter(Boolean) : []),
    ] as const,
}
