import { some, includes } from 'lodash'
import dayjs from 'dayjs'
import { PostgresColumn, PostgresTable } from '@supabase/postgres-meta'

import { tryParseJson } from 'lib/helpers'
import { ImportContent, TableField } from './TableEditor.types'
import { DEFAULT_COLUMNS } from './TableEditor.constants'
import { ColumnField } from '../SidePanelEditor.types'
import {
  generateColumnField,
  generateColumnFieldFromPostgresColumn,
} from '../ColumnEditor/ColumnEditor.utils'

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
    isRLSEnabled: false,
  }
}

export const generateTableFieldFromPostgresTable = (
  table: PostgresTable,
  isDuplicating = false
): TableField => {
  return {
    id: table.id,
    name: isDuplicating ? `${table.name}_duplicate` : table.name,
    comment: isDuplicating ? `This is a duplicate of ${table.name}` : table?.comment ?? '',
    columns: table.columns.map((column: PostgresColumn) => {
      return generateColumnFieldFromPostgresColumn(column, table)
    }),
    isRLSEnabled: table.rls_enabled,
  }
}

export const formatImportedContentToColumnFields = (importContent: ImportContent) => {
  const columnFields = importContent.headers.map((header: string) => {
    const columnType = inferColumnType(header, importContent.rows)
    return generateColumnField({ name: header, format: columnType })
  })
  return columnFields
}

export const inferColumnType = (column: string, rows: object[]) => {
  // General strategy is to check the first row first, before checking across all the rows
  // to ensure uniformity in data type. Thinking we do this as an optimization instead of
  // checking all the rows up front.

  // If there are no rows to infer for, default to text
  if (rows.length === 0) return 'text'

  const columnData = (rows[0] as any)[column]
  const columnDataAcrossRows = rows.map((row: object) => (row as any)[column])

  // Unable to infer any type as there's no data, default to text
  if (!columnData) {
    return 'text'
  }

  // Infer numerical data type (defaults to either int8 or float8)
  if (Number(columnData)) {
    const columnNumberCheck = rows.map((row: object) => Number((row as any)[column]))
    if (columnNumberCheck.includes(NaN)) {
      return 'text'
    } else {
      const columnFloatCheck = columnNumberCheck.map((num: number) => num % 1)
      return columnFloatCheck.every((item) => item === 0) ? 'int8' : 'float8'
    }
  }

  // Infer boolean type
  if (includes(['true', 'false'], columnData.toLowerCase())) {
    const isAllBoolean = columnDataAcrossRows.every((item: any) =>
      includes(['true', 'false'], item.toLowerCase())
    )
    if (isAllBoolean) {
      return 'boolean'
    }
  }

  // Infer json type
  if (tryParseJson(columnData)) {
    const isAllJson = columnDataAcrossRows.every((item: any) => tryParseJson(columnData))
    if (isAllJson) {
      return 'jsonb'
    }
  }

  // Infer datetime type
  if (dayjs(columnData, 'YYYY-MM-DD hh:mm:ss').isValid() && Date.parse(columnData)) {
    return 'timestamptz'
  }

  return 'text'
}
