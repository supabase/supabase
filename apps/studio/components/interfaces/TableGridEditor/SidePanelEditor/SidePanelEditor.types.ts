import type { PostgresRelationship } from '@supabase/postgres-meta'
import { CreateColumnBody } from 'data/database-columns/database-column-create-mutation'
import { UpdateColumnBody } from 'data/database-columns/database-column-update-mutation'

export interface CreateColumnPayload extends CreateColumnBody {}

export interface UpdateColumnPayload extends UpdateColumnBody {
  isPrimaryKey?: boolean
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
  table: string
  schema: string
  check: string | null
  comment?: string
  format: string
  defaultValue: string | null
  foreignKey?: ExtendedPostgresRelationship
  isNullable: boolean
  isUnique: boolean
  isArray: boolean
  isIdentity: boolean
  isPrimaryKey: boolean
  isNewColumn: boolean
  isEncrypted: boolean
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
