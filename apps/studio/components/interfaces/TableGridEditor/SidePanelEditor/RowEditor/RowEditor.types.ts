import type { PGTableRelationship } from '@supabase/pg-meta'

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
  value: string | null | undefined
  defaultValue: string | null
  foreignKey?: PGTableRelationship
  isNullable: boolean
  isIdentity: boolean
  isPrimaryKey: boolean
}
