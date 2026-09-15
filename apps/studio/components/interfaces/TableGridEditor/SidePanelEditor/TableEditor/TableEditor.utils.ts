import { some } from 'lodash'

import {
  generateColumnField,
  generateColumnFieldFromPGColumn,
} from '../ColumnEditor/ColumnEditor.utils'
import type { ColumnField } from '../SidePanelEditor.types'
import { DEFAULT_COLUMNS } from './TableEditor.constants'
import type { ImportContent, TableField } from './TableEditor.types'
import type { ForeignKeyConstraint } from '@/data/database/foreign-key-constraints-query'
import type { SafePostgresTable } from '@/lib/postgres-types'

type ValidateFieldsReturn = {
  name?: string
  columns?: string
}

export const validateFields = (field: TableField): ValidateFieldsReturn => {
  const errors: ValidateFieldsReturn = {}
  if (field.name.length === 0) {
    errors['name'] = 'Please assign a name for your table'
  }
  if (some(field.columns, (column: ColumnField) => column.format.length === 0)) {
    errors['columns'] = 'Ensure that all your columns are assigned a type'
  }
  if (some(field.columns, (column: ColumnField) => column.name.length === 0)) {
    errors['columns'] = 'Ensure that all your columns are named'
  }
  return errors
}

export const generateTableField = (): TableField => {
  return {
    id: 0,
    name: '',
    comment: '',
    columns: DEFAULT_COLUMNS,
    isRLSEnabled: true,
    isRealtimeEnabled: false,
  }
}

export const generateTableFieldFromPGTable = (
  table: SafePostgresTable,
  foreignKeys: ForeignKeyConstraint[],
  isDuplicating = false,
  isRealtimeEnabled = false
): TableField => {
  return {
    id: table.id,
    name: isDuplicating ? `${table.name}_duplicate` : table.name,
    comment: isDuplicating ? `This is a duplicate of ${table.name}` : table?.comment,
    columns: (table.columns ?? []).map((column) => {
      return generateColumnFieldFromPGColumn(column, table, foreignKeys)
    }),
    isRLSEnabled: table.rls_enabled,
    isRealtimeEnabled,
  }
}

// Merges only foreign-key metadata from a freshly server-derived TableField into
// the existing (possibly user-edited) one. Preserves user-added columns and any
// edits to existing columns; only injects `foreignKey` onto matching server-
// originated columns. Used when foreignKeyMeta resolves after the user has
// already started editing the panel.
export const mergeForeignKeyMeta = (existing: TableField, fromServer: TableField): TableField => {
  const serverColumnsById = new Map(fromServer.columns.map((col) => [col.id, col]))
  return {
    ...existing,
    columns: existing.columns.map((col) => {
      if (col.isNewColumn) return col
      const serverCol = serverColumnsById.get(col.id)
      if (!serverCol) return col
      return { ...col, foreignKey: serverCol.foreignKey }
    }),
  }
}

export const formatImportedContentToColumnFields = (importContent: ImportContent) => {
  const { headers, selectedHeaders, columnTypeMap } = importContent
  const columnFields = headers
    .filter((header) => selectedHeaders.includes(header))
    .map((header) => {
      const columnType = columnTypeMap[header]
      return generateColumnField({ name: header, format: columnType })
    })
  return columnFields
}
