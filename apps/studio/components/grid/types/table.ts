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

// Row markers for queue operations
interface PendingAddMarker {
  __tempId: string
}

interface PendingDeleteMarker {
  __isDeleted: true
}

export type PendingAddRow = SupaRow & PendingAddMarker

export type PendingDeleteRow = SupaRow & PendingDeleteMarker

export function isPendingAddRow(row: SupaRow): row is PendingAddRow {
  return '__tempId' in row && typeof (row as PendingAddRow).__tempId === 'string'
}

/** Check if row is pending deletion (has __isDeleted marker) */
export function isPendingDeleteRow(row: SupaRow): row is PendingDeleteRow {
  return '__isDeleted' in row && (row as PendingDeleteRow).__isDeleted === true
}
