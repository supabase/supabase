import * as React from 'react'
import { CalculatedColumn } from '@supabase/react-data-grid'
import { ColumnType, SupaColumn, SupaRow, SupaTable } from '../types'
import {
  isArrayColumn,
  isBoolColumn,
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
  NullableBooleanEditor,
  NumberEditor,
  SelectEditor,
  TextEditor,
  TimeEditor,
  TimeWithTimezoneEditor,
} from '../components/editor'
import { AddColumn, ColumnHeader, SelectColumn } from '../components/grid'
import { COLUMN_MIN_WIDTH } from '../constants'
import { BooleanFormatter, DefaultFormatter, ForeignKeyFormatter } from '../components/formatter'

const ESTIMATED_CHARACTER_PIXEL_WIDTH = 9

export function getGridColumns(
  table: SupaTable,
  options?: {
    editable?: boolean
    defaultWidth?: string | number
    onAddColumn?: () => void
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
      rowGroup: false,
      headerRenderer: (props) => (
        <ColumnHeader
          {...props}
          columnType={columnType}
          isPrimaryKey={x.isPrimaryKey}
          format={x.format}
        />
      ),
      editor: options?.editable ? getColumnEditor(x, columnType) : undefined,
      formatter: getColumnFormatter(x, columnType),
    }

    return columnDefinition
  })

  const gridColumns = [SelectColumn, ...columns]
  if (options?.onAddColumn) {
    gridColumns.push(AddColumn)
  }

  return gridColumns
}

function getColumnEditor(columnDefinition: SupaColumn, columnType: ColumnType) {
  if (columnDefinition.isPrimaryKey || !columnDefinition.isUpdatable) {
    return
  }

  switch (columnType) {
    case 'boolean': {
      return columnDefinition.isNullable ? NullableBooleanEditor : BooleanEditor
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
      return (p: any) => <SelectEditor {...p} options={options} />
    }
    case 'array':
    case 'json': {
      return JsonEditor
    }
    case 'number': {
      return NumberEditor
    }
    case 'text': {
      return TextEditor
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

function getColumnDefaultWidth(columnDef: SupaColumn): number {
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
