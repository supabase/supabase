import type { SafeSqlFragment } from '../pg-format'

export type ActionConfig =
  | { action: 'count' | 'delete' | 'truncate' }
  | { action: 'select'; actionValue?: SafeSqlFragment }
  | { action: 'insert'; actionValue: Array<Dictionary<any>> }
  | { action: 'update'; actionValue: Dictionary<any> }

export interface Sort {
  table: string
  column: string
  ascending?: boolean
  nullsFirst?: boolean
}

export type FilterOperator =
  | '='
  | '<>'
  | '>'
  | '<'
  | '>='
  | '<='
  | '~~'
  | '~~*'
  | '!~~'
  | '!~~*'
  | 'in'
  | 'is'

export interface Filter {
  column: string | Array<string>
  operator: FilterOperator
  value: any
}

export interface Dictionary<T> {
  [Key: string]: T
}

export interface QueryTable {
  name: string
  schema: string
}

export interface QueryPagination {
  limit: number
  offset: number
}
