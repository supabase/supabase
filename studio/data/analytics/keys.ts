export const analyticsKeys = {
  functionsInvStats: (
    projectRef: string | undefined,
    { interval, functionId }: { functionId: string | undefined; interval: string | undefined }
  ) => ['projects', projectRef, 'functions-inv-stats', { interval, functionId }] as const,
  dailyStats: (
    projectRef: string | undefined,
    {
      attribute,
      startDate,
      endDate,
      interval,
    }: { attribute?: string; startDate?: string; endDate?: string; interval?: string }
  ) =>
    [
      'projects',
      projectRef,
      'daily-stats',
      {
        attribute,
        startDate: isoDateStringToDate(startDate),
        endDate: isoDateStringToDate(endDate),
        interval,
      },
    ] as const,
  orgDailyStats: (
    orgSlug: string | undefined,
    {
      metric,
      startDate,
      endDate,
      interval,
      projectRef,
    }: {
      metric?: string
      startDate?: string
      endDate?: string
      interval?: string
      projectRef?: string
    }
  ) =>
    [
      'organizations',
      orgSlug,
      'daily-stats',
      {
        metric,
        startDate: isoDateStringToDate(startDate),
        endDate: isoDateStringToDate(endDate),
        interval,
        projectRef,
      },
    ] as const,
  infraMonitoring: (
    projectRef: string | undefined,
    {
      attribute,
      startDate,
      endDate,
      interval,
    }: { attribute?: string; startDate?: string; endDate?: string; interval?: string }
  ) =>
    [
      'projects',
      projectRef,
      'infra-monitoring',
      { attribute, startDate, endDate, interval },
    ] as const,
  usageApiCounts: (projectRef: string | undefined, interval: string | undefined) =>
    ['projects', projectRef, 'usage.api-counts', interval] as const,

  usageApiRequestsCount: (projectRef: string | undefined) =>
    ['projects', projectRef, 'usage.api-requests-count'] as const,
}

function isoDateStringToDate(isoDateString: string | undefined): string | undefined {
  if (!isoDateString) return isoDateString

  return isoDateString.split('T')[0]
}
