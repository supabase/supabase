export type TableField = {
  name: string
  type:
    | 'text'
    | 'varchar'
    | 'uuid'
    | 'int2'
    | 'int4'
    | 'int8'
    | 'float4'
    | 'float8'
    | 'numeric'
    | 'bool'
    | 'json'
    | 'jsonb'
    | 'date'
    | 'time'
    | 'timestamp'
    | 'timestamptz'
    | 'timez'
    | 'bytea'
  nullable?: boolean
  unique?: boolean
  default?: string // Must be string for table editor compatibility
  description?: string
}

export type TableSuggestion = {
  tableName: string
  fields: TableField[]
  rationale?: string
  source: 'ai' | 'template'
}

export type TableTemplate = {
  id: string
  name: string
  iconName: string
  category: string
  tables: TableSuggestion[]
}
