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
  column: string
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
