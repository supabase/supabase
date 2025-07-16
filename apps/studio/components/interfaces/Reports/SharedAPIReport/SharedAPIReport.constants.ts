import { get } from 'data/fetchers'
import { generateRegexpWhere } from '../Reports.constants'
import { ReportFilterItem } from '../Reports.types'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import * as Sentry from '@sentry/nextjs'
import { useState } from 'react'
import { useParams } from 'common'
import { isEqual } from 'lodash'

export const SHARED_API_REPORT_SQL = {
  totalRequests: {
    queryType: 'logs',
    sql: (filters: ReportFilterItem[], src = 'edge_logs') => `
        --reports-api-total-requests
        select
          cast(timestamp_trunc(t.timestamp, hour) as datetime) as timestamp,
          count(t.id) as count
        FROM ${src} t
          cross join unnest(metadata) as m
          cross join unnest(m.response) as response
          cross join unnest(m.request) as request
          cross join unnest(request.headers) as headers
          ${generateRegexpWhere(filters)}
        GROUP BY
          timestamp
        ORDER BY
          timestamp ASC`,
  },
  topRoutes: {
    queryType: 'logs',
    sql: (filters: ReportFilterItem[], src = 'edge_logs') => `
        -- reports-api-top-routes
        select
          request.path as path,
          request.method as method,
          request.search as search,
          response.status_code as status_code,
          count(t.id) as count
        from ${src} t
          cross join unnest(metadata) as m
          cross join unnest(m.response) as response
          cross join unnest(m.request) as request
          cross join unnest(request.headers) as headers
          ${generateRegexpWhere(filters)}
        group by
          request.path, request.method, request.search, response.status_code
        order by
          count desc
        limit 10
        `,
  },
  errorCounts: {
    queryType: 'logs',
    sql: (filters: ReportFilterItem[], src = 'edge_logs') => `
        -- reports-api-error-counts
        select
          cast(timestamp_trunc(t.timestamp, hour) as datetime) as timestamp,
          count(t.id) as count
        FROM ${src} t
          cross join unnest(metadata) as m
          cross join unnest(m.response) as response
          cross join unnest(m.request) as request
          cross join unnest(request.headers) as headers
        WHERE
          response.status_code >= 400
        ${generateRegexpWhere(filters, false)}
        GROUP BY
          timestamp
        ORDER BY
          timestamp ASC
        `,
  },
  topErrorRoutes: {
    queryType: 'logs',
    sql: (filters: ReportFilterItem[], src = 'edge_logs') => `
        -- reports-api-top-error-routes
        select
          request.path as path,
          request.method as method,
          request.search as search,
          response.status_code as status_code,
          count(t.id) as count
        from ${src} t
          cross join unnest(metadata) as m
          cross join unnest(m.response) as response
          cross join unnest(m.request) as request
          cross join unnest(request.headers) as headers
        where
          response.status_code >= 400
        ${generateRegexpWhere(filters, false)}
        group by
          request.path, request.method, request.search, response.status_code
        order by
          count desc
        limit 10
        `,
  },
  responseSpeed: {
    queryType: 'logs',
    sql: (filters: ReportFilterItem[], src = 'edge_logs') => `
        -- reports-api-response-speed
        select
          cast(timestamp_trunc(t.timestamp, hour) as datetime) as timestamp,
          avg(response.origin_time) as avg
        FROM
          ${src} t
          cross join unnest(metadata) as m
          cross join unnest(m.response) as response
          cross join unnest(m.request) as request
          cross join unnest(request.headers) as headers
          ${generateRegexpWhere(filters)}
        GROUP BY
          timestamp
        ORDER BY
          timestamp ASC
      `,
  },
  topSlowRoutes: {
    queryType: 'logs',
    sql: (filters: ReportFilterItem[], src = 'edge_logs') => `
        -- reports-api-top-slow-routes
        select
          request.path as path,
          request.method as method,
          request.search as search,
          response.status_code as status_code,
          count(t.id) as count,
          avg(response.origin_time) as avg
        from ${src} t
          cross join unnest(metadata) as m
          cross join unnest(m.response) as response
          cross join unnest(m.request) as request
          cross join unnest(request.headers) as headers
        ${generateRegexpWhere(filters)}
        group by
          request.path, request.method, request.search, response.status_code
        order by
          avg desc
        limit 10
        `,
  },
  networkTraffic: {
    queryType: 'logs',
    sql: (filters: ReportFilterItem[], src = 'edge_logs') => `
        -- reports-api-network-traffic
        select
          cast(timestamp_trunc(t.timestamp, hour) as datetime) as timestamp,
          coalesce(
            safe_divide(
              sum(
                cast(coalesce(headers.content_length, "0") as int64)
              ),
              1000000
            ),
            0
          ) as ingress_mb,
          coalesce(
            safe_divide(
              sum(
                cast(coalesce(resp_headers.content_length, "0") as int64)
              ),
              1000000
            ),
            0
          ) as egress_mb,
        FROM
          ${src} t
          cross join unnest(metadata) as m
          cross join unnest(m.response) as response
          cross join unnest(m.request) as request
          cross join unnest(request.headers) as headers
          cross join unnest(response.headers) as resp_headers
          ${generateRegexpWhere(filters)}
        GROUP BY
          timestamp
        ORDER BY
          timestamp ASC
        `,
  },
}

export type SharedAPIReportKey = keyof typeof SHARED_API_REPORT_SQL

const fetchLogs = async ({
  projectRef,
  sql,
  start,
  end,
}: {
  projectRef: string
  sql: string
  start: string
  end: string
}) => {
  const { data, error } = await get(`/platform/projects/{ref}/analytics/endpoints/logs.all`, {
    params: {
      path: { ref: projectRef },
      query: {
        sql,
        iso_timestamp_start: start,
        iso_timestamp_end: end,
      },
    },
  })

  if (error || data?.error) {
    Sentry.captureException({
      message: 'Shared API Report Error',
      data: {
        error,
        data,
      },
    })
    throw error || data?.error
  }

  return data
}

const DEFAULT_KEYS = ['shared-api-report']

type SharedAPIReportParams = {
  filterBy: 'auth' | 'realtime' | 'storage' | 'graphql' | 'functions' | 'postgrest'
  start: string
  end: string
  projectRef: string
  enabled?: boolean
}
export const useSharedAPIReport = ({
  filterBy,
  start,
  end,
  enabled = true,
}: Omit<SharedAPIReportParams, 'projectRef'>) => {
  const { ref } = useParams() as { ref: string }
  const [filters, setFilters] = useState<ReportFilterItem[]>([])
  const queryClient = useQueryClient()
  const filterByMapSource = {
    functions: 'function_edge_logs',
    realtime: 'edge_logs',
    storage: 'edge_logs',
    graphql: 'edge_logs',
    postgrest: 'edge_logs',
    auth: 'edge_logs',
  }

  const filterByMapValue = {
    functions: '/functions',
    realtime: '/realtime',
    storage: '/storage',
    graphql: '/graphql',
    postgrest: '/rest',
    auth: '/auth',
  }

  const baseFilter = {
    key: 'request.path',
    value: filterByMapValue[filterBy],
    compare: 'matches' as const,
  }

  const allFilters = [baseFilter, ...filters]

  const queries = useQueries({
    queries: Object.entries(SHARED_API_REPORT_SQL).map(([key, value]) => ({
      queryKey: [...DEFAULT_KEYS, key, filterByMapSource[filterBy], filters, start, end, ref],
      enabled: enabled && !!ref && !!filterBy,
      queryFn: () =>
        fetchLogs({
          projectRef: ref,
          sql: value.sql(allFilters, filterByMapSource[filterBy]),
          start,
          end,
        }),
    })),
  })

  const keys = Object.keys(SHARED_API_REPORT_SQL) as Array<keyof typeof SHARED_API_REPORT_SQL>

  const data = keys.reduce(
    (acc, key, i) => {
      acc[key] = queries[i].data?.result || []
      return acc
    },
    {} as { [K in keyof typeof SHARED_API_REPORT_SQL]: unknown[] }
  )

  const error = keys.reduce(
    (acc, key, i) => {
      acc[key] = queries[i].error as string
      return acc
    },
    {} as { [K in keyof typeof SHARED_API_REPORT_SQL]: string }
  )

  const isLoading = keys.reduce(
    (acc, key, i) => {
      acc[key] = queries[i].isLoading
      return acc
    },
    {} as { [K in keyof typeof SHARED_API_REPORT_SQL]: boolean }
  )
  const addFilter = (filter: ReportFilterItem) => {
    if (isEqual(filter, baseFilter)) return
    if (filters.some((f) => isEqual(f, filter))) return
    setFilters((prev) =>
      [...prev, filter].sort((a, b) => {
        const keyA = a.key.toLowerCase()
        const keyB = b.key.toLowerCase()
        if (keyA < keyB) {
          return -1
        }
        if (keyA > keyB) {
          return 1
        }
        return 0
      })
    )
  }

  const removeFilters = (toRemove: ReportFilterItem[]) => {
    setFilters((prev) => prev.filter((f) => !toRemove.find((r) => isEqual(f, r))))
  }

  const isLoadingData = Object.values(isLoading).some(Boolean)

  return {
    data,
    error,
    isLoading,
    isLoadingData,
    isRefetching: queryClient.isFetching({ queryKey: DEFAULT_KEYS }) > 0 || false,
    refetch: () => queryClient.invalidateQueries({ queryKey: DEFAULT_KEYS }),
    filters,
    addFilter,
    removeFilters,
  }
}
