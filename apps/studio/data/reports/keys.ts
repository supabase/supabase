import type { LogsEndpointParams } from '@/components/interfaces/Settings/Logs/Logs.types'
import type { SafeLogSqlFragment } from '@/data/logs/safe-analytics-sql'

export type ApiReportRequestParams = Required<
  Pick<LogsEndpointParams, 'iso_timestamp_start' | 'iso_timestamp_end'>
>

type SharedApiReportMetricParams<
  FilterBy extends string,
  QueryName extends string,
  Filters extends readonly unknown[],
> = {
  filterBy: FilterBy
  queryName: QueryName
  source: string
  filters: Filters
  start: string
  end: string
  projectRef: string
  useOtel: boolean
}

export const reportKeys = {
  apiMetric: (
    projectRef: string | undefined,
    queryName: string,
    params: ApiReportRequestParams,
    sql: SafeLogSqlFragment,
    useOtel: boolean
  ) => ['projects', projectRef, 'api-report', queryName, params, sql, { otel: useOtel }] as const,
  allSharedApi: ['shared-api-report'] as const,
  sharedApiMetric: <
    FilterBy extends string,
    QueryName extends string,
    Filters extends readonly unknown[],
  >({
    filterBy,
    queryName,
    source,
    filters,
    start,
    end,
    projectRef,
    useOtel,
  }: SharedApiReportMetricParams<FilterBy, QueryName, Filters>) =>
    [
      ...reportKeys.allSharedApi,
      filterBy,
      queryName,
      source,
      filters,
      start,
      end,
      projectRef,
      { otel: useOtel },
    ] as const,
}
