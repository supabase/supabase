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
    | 'bigint'
  nullable?: boolean
  unique?: boolean
  default?: string // Must be string for table editor compatibility
  description?: string
  isPrimary?: boolean
  isForeign?: boolean
  references?: string
}

export type TableRelationship = {
  from: string
  to: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many' | 'many-to-one'
}

export type TableSuggestion = {
  tableName: string
  fields: TableField[]
  rationale?: string
  source: 'ai' | 'template'
  relationships?: TableRelationship[]
}

export type AIGeneratedSchema = {
  tables: Array<{
    name: string
    description: string
    columns: Array<{
      name: string
      type: string
      isPrimary?: boolean
      isForeign?: boolean
      references?: string
      isNullable?: boolean
      defaultValue?: string
      isUnique?: boolean
    }>
    relationships?: TableRelationship[]
  }>
  summary: string
}

export type TableTemplate = {
  id: string
  name: string
  iconName: string
  category: string
  tables: TableSuggestion[]
}
