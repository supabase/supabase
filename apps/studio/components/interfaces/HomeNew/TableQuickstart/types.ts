export type TableField = {
  name: string
  type: string // e.g., "text" | "uuid" | "int" | etc.
  nullable?: boolean
  default?: string | number | boolean | null
  description?: string
}

export type TableSuggestion = {
  tableName: string
  fields: TableField[]
  rationale?: string
  source: 'ai' | 'template'
}