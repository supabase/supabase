import { type inferParserType } from 'nuqs'

import { SEARCH_PARAMS_PARSER } from './UnifiedLogs.constants'
import type { BaseChartSchema, ColumnSchema, FacetMetadataSchema } from './UnifiedLogs.schema'

type Percentile = 50 | 75 | 90 | 95 | 99

export type UnifiedLogSchema = {
  id: string
  timestamp: Date
  log_type:
    | 'edge'
    | 'postgres'
    | 'function logs'
    | 'edge function'
    | 'auth'
    | 'supavisor'
    | 'postgres upgrade'
  code: string
  level: string
  path: string | null
  event_message: string
  method: string
  api_role: string
  auth_user: string | null
}

// Extended column schema to include raw timestamp
export type ExtendedColumnSchema = ColumnSchema & {
  timestamp: string // Original database timestamp
  date: Date // Date object for display
}

export type LogsMeta = {
  currentPercentiles: Record<Percentile, number>
}

export type UnifiedLogsMeta = {
  logTypeCounts: Record<UnifiedLogSchema['log_type'], number>
  currentPercentiles: Record<string, number>
}

export type PageParam = { cursor: number; direction: 'next' | 'prev' }

export type SearchParamsType = inferParserType<typeof SEARCH_PARAMS_PARSER>

type InfiniteQueryMeta<TMeta = Record<string, unknown>> = {
  totalRowCount: number
  filterRowCount: number
  chartData: BaseChartSchema[]
  facets: Record<string, FacetMetadataSchema>
  metadata?: TMeta
}

export type InfiniteQueryResponse<TData, TMeta = unknown> = {
  data: TData
  meta: InfiniteQueryMeta<TMeta>
  prevCursor: number | null
  nextCursor: number | null
}

export type SearchParams = {
  [key: string]: string | string[] | undefined
}

/** ----------------------------------------- */

export type SheetField<TData, TMeta = Record<string, unknown>> = {
  id: keyof TData
  label: string
  // FIXME: rethink that! I dont think we need this as there is no input type
  // REMINDER: readonly if we only want to copy the value (e.g. uuid)
  // TODO: we might have some values that are not in the data but can be computed
  type: 'readonly' | 'input' | 'checkbox' | 'slider' | 'timerange'
  component?: (
    // REMINDER: this is used to pass additional data like the `InfiniteQueryMeta`
    props: TData & {
      metadata?: {
        totalRows: number
        filterRows: number
        totalRowsFetched: number
      } & TMeta
    }
  ) => JSX.Element | null | string
  condition?: (props: TData) => boolean
  className?: string
  skeletonClassName?: string
}
