import { SearchParamsType } from 'components/interfaces/UnifiedLogs/UnifiedLogs.types'

export const logsKeys = {
  unifiedLogsInfinite: (
    projectRef: string | undefined,
    searchParams: SearchParamsType | undefined
  ) =>
    [
      'projects',
      projectRef,
      'unified-logs',
      'logs-data',
      ...(searchParams ? [searchParams].filter(Boolean) : []),
    ] as const,
  unifiedLogsCount: (projectRef: string | undefined, searchParams: SearchParamsType | undefined) =>
    [
      'projects',
      projectRef,
      'unified-logs',
      'count-data',
      ...(searchParams ? [searchParams].filter(Boolean) : []),
    ] as const,
  unifiedLogsChart: (projectRef: string | undefined, searchParams: SearchParamsType | undefined) =>
    [
      'projects',
      projectRef,
      'unified-logs',
      'chart-data',
      ...(searchParams ? [searchParams].filter(Boolean) : []),
    ] as const,
}
