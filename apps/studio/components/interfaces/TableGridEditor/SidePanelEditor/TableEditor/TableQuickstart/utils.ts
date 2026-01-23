import type { TableSuggestion, TableField } from './types'
import type { ColumnField } from '../../SidePanelEditor.types'
import type { TableField as EditorTableField } from '../TableEditor.types'

export const DEFAULT_SCHEMA = 'public' as const

export function isPrimaryKeyField(field: TableField): boolean {
  return field.isPrimary === true || field.name === 'id'
}

export function isIdentityField(field: TableField): boolean {
  return field.name === 'id' && field.type.toLowerCase().includes('int') && !field.default
}

export function convertTableSuggestionToTableField(
  table: TableSuggestion
): Partial<EditorTableField> {
  const columns: ColumnField[] = table.fields.map((field, index) => {
    const isPrimaryKey = isPrimaryKeyField(field)
    const isIdentity = isIdentityField(field)
    const defaultValue = field.default ? String(field.default) : null

    return {
      id: `column-${index}`,
      name: field.name,
      format: field.type,
      defaultValue,
      isNullable: field.nullable !== false,
      isUnique: field.unique ?? false,
      isIdentity,
      isPrimaryKey,
      comment: field.description || '',
      isNewColumn: true,
      table: table.tableName,
      schema: DEFAULT_SCHEMA,
      check: null,
      isArray: false,
      isEncrypted: false,
    }
  })

  return {
    name: table.tableName,
    comment: table.rationale || '',
    columns,
  }
}
