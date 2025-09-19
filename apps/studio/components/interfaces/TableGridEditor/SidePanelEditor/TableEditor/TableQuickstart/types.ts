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
  isForeign?: boolean
  references?: string
}

export type TableRelationship = {
  from: string
  to: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many' | 'many-to-one'
}

export enum TableSource {
  AI = 'ai',
  TEMPLATE = 'template',
}

export enum QuickstartVariant {
  CONTROL = 'control',
  AI = 'ai',
  TEMPLATES = 'templates',
}

export enum ViewMode {
  INITIAL = 'initial',
  AI_INPUT = 'ai-input',
  AI_RESULTS = 'ai-results',
  CATEGORY_SELECTED = 'category-selected',
}

export type TableSuggestion = {
  tableName: string
  fields: TableField[]
  rationale?: string
  source: TableSource
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
