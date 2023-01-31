import type { PostgresRelationship } from '@supabase/postgres-meta'

export interface JsonEditValue {
  column: string
  jsonString: string
}

export interface ReferenceRow {
  loading: boolean
  foreignKey: any // ForeignKey
  row: any // RowField
}

export interface RowField {
  id: string
  name: string
  comment: string
  format: string
  enums: string[]
  value: string | null
  defaultValue: string | null
  foreignKey?: PostgresRelationship
  isNullable: boolean
  isIdentity: boolean
  isPrimaryKey: boolean
}
