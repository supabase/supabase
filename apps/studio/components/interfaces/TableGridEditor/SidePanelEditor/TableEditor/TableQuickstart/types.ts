export type PostgresType =
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
  | 'timetz'
  | 'bytea'

export type TableField = {
  name: string
  type: PostgresType
  nullable?: boolean
  unique?: boolean
  default?: string // Must be string for table editor compatibility
  description?: string
  isPrimary?: boolean
}

export enum TableSource {
  AI = 'ai',
  TEMPLATE = 'template',
}

export enum QuickstartVariant {
  CONTROL = 'control',
  AI = 'ai',
  TEMPLATES = 'templates',
  ASSISTANT = 'assistant',
}

export type TableSuggestion = {
  tableName: string
  fields: TableField[]
  rationale?: string
  source: TableSource
}

export type AIGeneratedSchema = {
  tables: Array<{
    name: string
    description: string
    columns: Array<{
      name: string
      type: string
      isPrimary?: boolean
      isNullable?: boolean
      defaultValue?: string
      isUnique?: boolean
    }>
  }>
  summary: string
}
