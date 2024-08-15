export const analyticsKeys = {
  // warehouse
  warehouseQuery: (projectRef: string, query: string) =>
    ['projects', projectRef, 'warehouse', 'query', query] as const,
  warehouseTenant: (projectRef: string) => ['projects', projectRef, 'warehouse', 'tenant'] as const,
  warehouseCollections: (projectRef: string) =>
    ['projects', projectRef, 'warehouse', 'collections'] as const,
  warehouseCollectionsCreate: (projectRef: string) =>
    ['projects', projectRef, 'warehouse', 'collections', 'create'] as const,
  warehouseEndpoints: (projectRef: string) =>
    ['projects', projectRef, 'warehouse', 'endpoints'] as const,
  warehouseBackends: (projectRef: string) =>
    ['projects', projectRef, 'warehouse', 'backends'] as const,
  warehouseAccessTokens: (projectRef: string) =>
    ['projects', projectRef, 'warehouse', 'access-tokens'] as const,

  // logs/reports endpoints
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

  orgDailyComputeStats: (
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
      'daily-stats-compute',
      {
        startDate: isoDateStringToDate(startDate),
        endDate: isoDateStringToDate(endDate),
        projectRef,
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
