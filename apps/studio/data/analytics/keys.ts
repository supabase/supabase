export const analyticsKeys = {
  // logs/reports endpoints
  functionsCombinedStats: (
    projectRef: string | undefined,
    {
      interval,
      functionId,
    }: {
      functionId: string | undefined
      interval: string | undefined
    }
  ) =>
    [
      'projects',
      projectRef,
      'functions-combined-stats',
      {
        interval,
        functionId,
      },
    ] as const,
  functionsInvStats: (
    projectRef: string | undefined,
    {
      interval,
      functionId,
    }: {
      functionId: string | undefined
      interval: string | undefined
    }
  ) =>
    [
      'projects',
      projectRef,
      'functions-inv-stats',
      {
        interval,
        functionId,
      },
    ] as const,
  functionsReqStats: (
    projectRef: string | undefined,
    {
      interval,
      functionId,
    }: {
      functionId: string | undefined
      interval: string | undefined
    }
  ) =>
    [
      'projects',
      projectRef,
      'functions-req-stats',
      {
        interval,
        functionId,
      },
    ] as const,
  functionsResourceUsage: (
    projectRef: string | undefined,
    {
      interval,
      functionId,
    }: {
      functionId: string | undefined
      interval: string | undefined
    }
  ) =>
    [
      'projects',
      projectRef,
      'functions-resource-usage',
      {
        interval,
        functionId,
      },
    ] as const,

  orgDailyStats: (
    orgSlug: string | undefined,
    {
      startDate,
      endDate,
      projectRef,
    }: {
      startDate?: string
      endDate?: string
      projectRef?: string
    }
  ) =>
    [
      'organizations',
      orgSlug,
      'daily-stats',
      {
        startDate: isoDateStringToDate(startDate),
        endDate: isoDateStringToDate(endDate),
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
      databaseIdentifier,
    }: {
      attribute?: string
      startDate?: string
      endDate?: string
      interval?: string
      databaseIdentifier?: string
    }
  ) =>
    [
      'projects',
      projectRef,
      'infra-monitoring',
      { attribute, startDate, endDate, interval, databaseIdentifier },
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
