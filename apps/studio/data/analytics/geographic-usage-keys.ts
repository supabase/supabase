import type { GeographicUsageRange } from './geographic-usage-query'

export const geographicUsageKeys = {
  usage: (projectRef: string | undefined, range: GeographicUsageRange, useOtel: boolean) =>
    ['projects', projectRef, 'geographic-usage', range, { otel: useOtel }] as const,
}
