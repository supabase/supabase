import { ResponseError } from 'types'
import { DEFAULT_QUERY_PARAMS } from './Reports.constants'

export enum Presets {
  API = 'api',
  STORAGE = 'storage',
  AUTH = 'auth',
  QUERY_PERFORMANCE = 'query_performance',
  DATABASE = 'database',
}

export type MetaQueryResponse = any & { error: ResponseError }

export type BaseReportParams = typeof DEFAULT_QUERY_PARAMS & { sql?: string } & unknown
export interface PresetConfig {
  title: string
  queries: BaseQueries<string>
}
export type BaseQueries<Keys extends string> = Record<Keys, ReportQuery>

export interface ReportQuery {
  queryType: ReportQueryType
  sql: (filters: ReportFilterItem[]) => string
}

export type ReportQueryType = 'db' | 'logs'

export interface StatusCodesDatum {
  timestamp: number
  status_code: number
  count: number
}
export interface PathsDatum {
  timestamp: number
  path: string
  query_params: string
  count: number
  sum: number
  method: string
  avg_origin_time: number
  quantiles: number[]
}

export interface ReportFilterItem {
  key: string
  value: string | number
  compare: 'matches' | 'is'
}
