import type { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import type { Dictionary } from 'types'
import { GridForeignKey } from './base'

export interface SupaColumn {
  readonly dataType: string
  readonly format: string
  readonly name: string
  readonly comment?: string | null
  readonly defaultValue?: string | null
  readonly enum?: string[] | null
  readonly isPrimaryKey?: boolean
  readonly isIdentity?: boolean
  readonly isGeneratable?: boolean
  readonly isNullable?: boolean
  readonly isUpdatable?: boolean
  readonly isEncrypted?: boolean
  readonly foreignKey?: GridForeignKey
  position: number
}

export interface SupaTable {
  readonly id: number
  readonly type: ENTITY_TYPE
  readonly columns: SupaColumn[]
  readonly name: string
  readonly schema?: string | null
  readonly comment?: string | null
  readonly estimateRowCount: number
  readonly primaryKey?: string[]
  readonly uniqueIndexes?: string[][]
}

export interface SupaRow extends Dictionary<any> {
  readonly idx: number
}
