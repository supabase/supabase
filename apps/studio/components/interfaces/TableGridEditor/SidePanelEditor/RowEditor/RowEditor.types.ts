import type { PostgresRelationship } from '@supabase/postgres-meta'

export interface EditValue {
  row?: any
  column: string
  value: string
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
