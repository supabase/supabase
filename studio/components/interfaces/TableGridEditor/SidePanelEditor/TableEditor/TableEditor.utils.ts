import { some } from 'lodash'
import type { PostgresColumn, PostgresTable } from '@supabase/postgres-meta'

import { ImportContent, TableField } from './TableEditor.types'
import { DEFAULT_COLUMNS } from './TableEditor.constants'
import { ColumnField } from '../SidePanelEditor.types'
import {
  generateColumnField,
  generateColumnFieldFromPostgresColumn,
} from '../ColumnEditor/ColumnEditor.utils'
import { ForeignKeyConstraint } from 'data/database/foreign-key-constraints-query'

export const validateFields = (field: TableField) => {
  const errors = {} as any
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

export const generateTableFieldFromPostgresTable = (
  table: PostgresTable,
  foreignKeys: ForeignKeyConstraint[],
  isDuplicating = false,
  isRealtimeEnabled = false
): TableField => {
  return {
    id: table.id,
    name: isDuplicating ? `${table.name}_duplicate` : table.name,
    comment: isDuplicating ? `This is a duplicate of ${table.name}` : table?.comment ?? '',
    // @ts-ignore
    columns: table.columns.map((column: PostgresColumn) => {
      return generateColumnFieldFromPostgresColumn(column, table, foreignKeys)
    }),
    isRLSEnabled: table.rls_enabled,
    isRealtimeEnabled,
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
