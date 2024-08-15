import type { Datum } from 'components/ui/Charts/Charts.types'
import React from 'react'

interface Metadata {
  [key: string]: string | number | Object | Object[] | any
}

export type DatePickerToFrom = { to: string | null; from: string | null }

export type LogSearchCallback = (
  event: 'search-input-change' | 'event-chart-bar-click' | 'datepicker-change',
  filters: {
    query?: string
  } & Partial<DatePickerToFrom>
) => void

export interface LogsWarning {
  text: string | React.ReactNode
  link?: string
  linkText?: string
}
export interface LogsEndpointParams {
  project: string // project ref
  iso_timestamp_start?: string
  iso_timestamp_end?: string
  sql?: string
}

export interface CustomLogData {
  [other: string]: unknown
}

export interface PreviewLogData extends CustomLogData {
  id: string
  timestamp: number
  event_message: string
  metadata?: Metadata
}
export type LogData = CustomLogData & PreviewLogData

export interface LogTemplate {
  label?: string
  description?: string
  mode: 'custom' | 'simple'
  for?: string[]
  searchString: string
}

export interface CountData {
  count: number
}

export interface EventChartData extends Datum {
  count: number
  timestamp: string
}

type LFResponse<T> = {
  result: T[]
  error?: {
    code: number
    errors: {
      domain: string
      message: string
      reason: string | 'resourcesExceeded'
    }[]
    message: string
    status: string
  }
}
type ApiError = string

export type LogQueryError = Omit<LFResponse<unknown>, 'result'> | ApiError

export type Count = LFResponse<CountData>
export type EventChart = LFResponse<EventChartData>

export type Logs = LFResponse<LogData>

export type QueryType =
  | 'api'
  | 'database'
  | 'functions'
  | 'fn_edge'
  | 'auth'
  | 'realtime'
  | 'storage'
  | 'supavisor'
  | 'postgrest'
  | 'warehouse'

export type Mode = 'simple' | 'custom'

export type Table = 'edge_logs' | 'postgres_logs'

export interface FilterObject {
  // severity?: string[]
  // status_code?: string[]

  // `q` for the editor query.
  q?: string
  // `s` for search query.
  s?: string
  // `te` for timestamp start value.
  te?: string
}

export interface FilterSet {
  label: string
  key: string
  options: FilterOption[]
}
export interface FilterOption {
  key: string
  label: string
  description?: string
}

export type FilterTableSet = {
  [table: string]: {
    [filterName: string]: FilterSet
  }
}

export interface Filters {
  [key: string]: string | string[] | boolean | undefined | Filters
}

export type Override = {
  key: string
  value: string | string[] | undefined
}

export interface DatetimeHelper {
  text: string
  calcTo: () => string
  calcFrom: () => string
  default?: boolean
  disabled?: boolean
}

export interface WarehouseCollection {
  name: string
  id: number
  token: string
}
