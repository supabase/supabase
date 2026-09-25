import type { GeographicUsageRange } from './geographic-usage-query'

export const geographicUsageKeys = {
  usage: (projectRef: string | undefined, range: GeographicUsageRange, useOtel: boolean) =>
    ['projects', projectRef, 'geographic-usage', range, { otel: useOtel }] as const,
  trend: (
    projectRef: string | undefined,
    countryCode: string | undefined,
    range: GeographicUsageRange,
    useOtel: boolean
  ) =>
    [
      'projects',
      projectRef,
      'geographic-usage-trend',
      countryCode,
      range,
      { otel: useOtel },
    ] as const,
}
