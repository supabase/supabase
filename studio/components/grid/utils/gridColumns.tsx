import * as React from 'react'
import { CalculatedColumn } from 'react-data-grid'
import { ColumnType, SupaColumn, SupaRow, SupaTable } from '../types'
import {
  isArrayColumn,
  isBoolColumn,
  isCiTextColumn,
  isDateColumn,
  isDateTimeColumn,
  isEnumColumn,
  isForeignKeyColumn,
  isJsonColumn,
  isNumericalColumn,
  isTextColumn,
  isTimeColumn,
} from './types'
import {
  BooleanEditor,
  DateEditor,
  DateTimeEditor,
  DateTimeWithTimezoneEditor,
  JsonEditor,
  NumberEditor,
  SelectEditor,
  TextEditor,
  TimeEditor,
  TimeWithTimezoneEditor,
} from 'components/grid/components/editor'
import { AddColumn, ColumnHeader, SelectColumn } from 'components/grid/components/grid'
import { COLUMN_MIN_WIDTH } from 'components/grid/constants'
import {
  BooleanFormatter,
  DefaultFormatter,
  ForeignKeyFormatter,
  JsonFormatter,
} from 'components/grid/components/formatter'

export const ESTIMATED_CHARACTER_PIXEL_WIDTH = 9

export function getGridColumns(
  table: SupaTable,
  options?: {
    editable?: boolean
    defaultWidth?: string | number
    onAddColumn?: () => void
    onExpandJSONEditor: (column: string, row: SupaRow) => void
  }
): any[] {
  const columns = table.columns.map((x, idx) => {
    const columnType = getColumnType(x)
    const columnDefaultWidth = getColumnDefaultWidth(x)
    const columnWidthBasedOnName =
      (x.name.length + x.format.length) * ESTIMATED_CHARACTER_PIXEL_WIDTH
    const columnWidth = options?.defaultWidth
      ? options.defaultWidth
      : columnDefaultWidth < columnWidthBasedOnName
      ? columnWidthBasedOnName
      : columnDefaultWidth

    const columnDefinition: CalculatedColumn<SupaRow> = {
      key: x.name,
      name: x.name,
      idx: idx + 1,
      resizable: true,
      sortable: true,
      width: columnWidth,
      minWidth: COLUMN_MIN_WIDTH,
      frozen: x.isPrimaryKey || false,
      isLastFrozenColumn: false,
      // rowGroup: false,
      renderHeaderCell: (props) => (
        <ColumnHeader
          {...props}
          columnType={columnType}
          isPrimaryKey={x.isPrimaryKey}
          isEncrypted={x.isEncrypted}
          format={x.format}
          foreignKey={x.foreignKey}
        />
      ),
      renderEditCell: options
        ? getColumnEditor(x, columnType, options?.editable ?? false, options.onExpandJSONEditor)
        : undefined,
      renderCell: getColumnFormatter(x, columnType),

      // [Next 18 Refactor] Double check if this is correct
      parent: undefined,
      level: 0,
      maxWidth: undefined,
      draggable: false,
    }

    return columnDefinition
  })

  const gridColumns = [SelectColumn, ...columns]
  if (options?.onAddColumn) {
    gridColumns.push(AddColumn)
  }

  return gridColumns
}

function getColumnEditor(
  columnDefinition: SupaColumn,
  columnType: ColumnType,
  isEditable: boolean,
  onExpandJSONEditor: (column: string, row: any) => void
) {
  if (!isEditable) {
    if (['array', 'json'].includes(columnType)) {
      // eslint-disable-next-line react/display-name
      return (p: any) => (
        <JsonEditor {...p} isEditable={isEditable} onExpandEditor={onExpandJSONEditor} />
      )
    } else if (!['number', 'boolean'].includes(columnType)) {
      // eslint-disable-next-line react/display-name
      return (p: any) => <TextEditor {...p} isEditable={isEditable} />
    } else {
      return
    }
  }
  if (columnDefinition.isPrimaryKey || !columnDefinition.isUpdatable) {
    return
  }

  switch (columnType) {
    case 'boolean': {
      // eslint-disable-next-line react/display-name
      return (p: any) => <BooleanEditor {...p} isNullable={columnDefinition.isNullable} />
    }
    case 'date': {
      return DateEditor
    }
    case 'datetime': {
      return columnDefinition.format.endsWith('z') ? DateTimeWithTimezoneEditor : DateTimeEditor
    }
    case 'time': {
      return columnDefinition.format.endsWith('z') ? TimeWithTimezoneEditor : TimeEditor
    }
    case 'enum': {
      const options = columnDefinition.enum!.map((x) => {
        return { label: x, value: x }
      })
      // eslint-disable-next-line react/display-name
      return (p: any) => <SelectEditor {...p} options={options} />
    }
    case 'array':
    case 'json': {
      // eslint-disable-next-line react/display-name
      return (p: any) => <JsonEditor {...p} onExpandEditor={onExpandJSONEditor} />
    }
    case 'number': {
      return NumberEditor
    }
    case 'citext':
    case 'text': {
      // eslint-disable-next-line react/display-name
      return (p: any) => (
        <TextEditor {...p} isEditable={isEditable} isNullable={columnDefinition.isNullable} />
      )
    }
    default: {
      return undefined
    }
  }
}

function getColumnFormatter(columnDef: SupaColumn, columnType: ColumnType) {
  switch (columnType) {
    case 'boolean': {
      return BooleanFormatter
    }
    case 'foreign_key': {
      if (columnDef.isPrimaryKey || !columnDef.isUpdatable) {
        return DefaultFormatter
      } else {
        return ForeignKeyFormatter
      }
    }
    case 'json': {
      return JsonFormatter
    }
    default: {
      return DefaultFormatter
    }
  }
}

function getColumnType(columnDef: SupaColumn): ColumnType {
  if (isForeignKeyColumn(columnDef)) {
    return 'foreign_key'
  } else if (isNumericalColumn(columnDef.dataType)) {
    return 'number'
  } else if (isArrayColumn(columnDef.dataType)) {
    return 'array'
  } else if (isJsonColumn(columnDef.dataType)) {
    return 'json'
  } else if (isTextColumn(columnDef.dataType)) {
    return 'text'
  } else if (isCiTextColumn(columnDef.format)) {
    return 'citext'
  } else if (isDateColumn(columnDef.format)) {
    return 'date'
  } else if (isTimeColumn(columnDef.format)) {
    return 'time'
  } else if (isDateTimeColumn(columnDef.format)) {
    return 'datetime'
  } else if (isBoolColumn(columnDef.dataType)) {
    return 'boolean'
  } else if (isEnumColumn(columnDef.dataType)) {
    return 'enum'
  } else return 'unknown'
}

export function getColumnDefaultWidth(columnDef: SupaColumn): number {
  if (isNumericalColumn(columnDef.dataType)) {
    return 120
  } else if (
    isDateTimeColumn(columnDef.format) ||
    isDateColumn(columnDef.format) ||
    isTimeColumn(columnDef.format)
  ) {
    return 150
  } else if (isBoolColumn(columnDef.dataType)) {
    return 120
  } else if (isEnumColumn(columnDef.dataType)) {
    return 150
  } else return 250
}
