import type { inferParserType } from 'nuqs'
import type { ReactNode } from 'react'

import { SEARCH_PARAMS_PARSER } from './UnifiedLogs.constants'
import type { LogsFilter } from './UnifiedLogs.filters'

type Percentile = 50 | 75 | 90 | 95 | 99

export type LogsMeta = {
  currentPercentiles: Record<Percentile, number>
}

export type PageParam = { cursor: number; direction: 'next' | 'prev' } | undefined

export type SearchParamsType = inferParserType<typeof SEARCH_PARAMS_PARSER>

/**
 * Fixed filters every query in a view applies on top of the user's, which the user can't
 * remove, e.g. an edge function's Logs tab narrowed to that function. Same columns and
 * operators as the `filter` URL param; any column that isn't a known one matches a
 * `log_attributes` key. Set by embedded views rather than read from the URL, and only the
 * ClickHouse queries support them.
 */
export type UnifiedLogsScope = { filters: LogsFilter[] }

export type QuerySearchParamsType = Omit<SearchParamsType, 'uuid' | 'live'> & {
  scope?: UnifiedLogsScope
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
  ) => ReactNode
  condition?: (props: TData) => boolean
  className?: string
  skeletonClassName?: string
}
