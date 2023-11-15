import { Dictionary, GridForeignKey } from './base'

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
  readonly columns: SupaColumn[]
  readonly name: string
  readonly schema?: string | null
  readonly comment?: string | null
}

export interface SupaRow extends Dictionary<any> {
  readonly idx: number
}
