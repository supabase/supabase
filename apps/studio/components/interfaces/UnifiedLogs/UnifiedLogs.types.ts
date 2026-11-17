import type { FetchPreviousPageOptions } from '@tanstack/react-query'
import type { inferParserType } from 'nuqs'
import type { ReactNode } from 'react'
import type { z } from 'zod'

import { SEARCH_PARAMS_PARSER } from './UnifiedLogs.constants'
import { querySearchParamsSchema, unifiedLogsScopeSchema } from './UnifiedLogs.schema'

type Percentile = 50 | 75 | 90 | 95 | 99

export type LogsMeta = {
  currentPercentiles: Record<Percentile, number>
}

export type PageParam = { cursor: number; direction: 'next' | 'prev' } | undefined

export type SearchParamsType = inferParserType<typeof SEARCH_PARAMS_PARSER>
export type UnifiedLogsScope = z.infer<typeof unifiedLogsScopeSchema>
export type QuerySearchParamsType = z.infer<typeof querySearchParamsSchema>

/** What a host needs to lay out the logs toolbar its own way, in place of the default row. */
export type UnifiedLogsToolbarSlots = {
  /** The filter bar, already wired to the logs table. */
  filterBar: ReactNode
  isRefreshing: boolean
  onRefresh: () => void
  /** For the download menu, which exports what the current filters match. */
  searchParameters: QuerySearchParamsType
  /** Present when the current sort supports live tailing. */
  fetchPreviousPage?: (options?: FetchPreviousPageOptions) => Promise<unknown>
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
