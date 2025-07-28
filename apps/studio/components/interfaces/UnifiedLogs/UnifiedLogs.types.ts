import { type inferParserType } from 'nuqs'

import { LOG_TYPES, SEARCH_PARAMS_PARSER } from './UnifiedLogs.constants'

type Percentile = 50 | 75 | 90 | 95 | 99

export type LogType = (typeof LOG_TYPES)[number]

export type UnifiedLogSchema = {
  id: string
  timestamp: Date
  log_type: LogType
  code: string
  level: string
  path: string | null
  event_message: string
  method: string
  api_role: string
  auth_user: string | null
}

export type LogsMeta = {
  currentPercentiles: Record<Percentile, number>
}

export type PageParam = { cursor: number; direction: 'next' | 'prev' } | undefined

export type SearchParamsType = inferParserType<typeof SEARCH_PARAMS_PARSER>
export type QuerySearchParamsType = Omit<SearchParamsType, 'uuid' | 'live'>

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
