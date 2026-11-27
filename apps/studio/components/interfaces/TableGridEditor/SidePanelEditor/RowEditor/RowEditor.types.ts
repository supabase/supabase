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
  isGenerated: boolean
  isPrimaryKey: boolean
}

/**
 * Why a field copied from another row has no value yet: its full value is still loading, or it
 * couldn't be copied.
 */
export type LargeValueStatus = 'loading' | 'too-large' | 'no-primary-key' | 'failed'
