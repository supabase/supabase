import type { PostgresRelationship } from '@supabase/postgres-meta'

export interface CreateColumnPayload {
  tableId: number
  name: string
  type: string
  check?: string | null
  comment?: string
  defaultValue?: any
  defaultValueFormat?: 'expression' | 'literal'
  isIdentity?: boolean
  identityGeneration?: 'BY DEFAULT' | 'ALWAYS'
  isNullable?: boolean
  isPrimaryKey?: boolean
  isUnique?: boolean
}

export interface UpdateColumnPayload {
  name?: string
  comment?: string | null
  type?: string
  check?: string | null
  dropDefault?: boolean
  defaultValue?: any
  defaultValueFormat?: 'expression' | 'literal'
  isIdentity?: boolean
  isNullable?: boolean
  isUnique?: boolean
  isPrimaryKey?: boolean
  identityGeneration?: 'BY DEFAULT' | 'ALWAYS'
}

export interface CreateTablePayload {
  name: string
  schema?: string
  comment?: string
}

export interface UpdateTablePayload {
  name?: string
  schema?: string
  comment?: string
  rls_enabled?: boolean
  rls_forced?: boolean
  replica_identity?: 'DEFAULT' | 'INDEX' | 'FULL' | 'NOTHING'
  replica_identity_index?: string
}

export interface Field {
  name: string
  required: boolean
  value: any
  description?: string
  enums?: string[]
  format?: string
  placeholder?: string
  foreignKey?: { table: string; column: string }
}

export interface ExtendedPostgresRelationship extends PostgresRelationship {
  deletion_action: string
  update_action: string
}

export interface ColumnField {
  id: string
  name: string
  check: string | null
  comment?: string
  format: string
  defaultValue: string | null
  foreignKey: ExtendedPostgresRelationship | undefined
  isNullable: boolean
  isUnique: boolean
  isArray: boolean
  isIdentity: boolean
  isPrimaryKey: boolean
  isNewColumn: boolean

  isEncrypted: boolean
  keyId?: string
  keyName?: string
}

export interface PostgresDataTypeOption {
  name: string
  description: string
  type: 'number' | 'text' | 'time' | 'json' | 'bool' | 'others'
}

// Probably belongs to a higher level
export interface Dictionary<T> {
  [Key: string]: T
}
