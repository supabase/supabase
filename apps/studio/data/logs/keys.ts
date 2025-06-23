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
      ...(searchParams ? [searchParams].filter(Boolean) : []),
    ] as const,
  usersCount: (projectRef: string | undefined, searchParams: SearchParamsType | undefined) =>
    [
      'projects',
      projectRef,
      'unified-logs-count',
      ...(searchParams ? [searchParams].filter(Boolean) : []),
    ] as const,
}
