import { MAX_ARRAY_SIZE, MAX_CHARACTERS } from '@supabase/pg-meta/src/query/table-row-query'
import type { PostgresColumn, PostgresRelationship, PostgresTable } from '@supabase/postgres-meta'
import dayjs from 'dayjs'
import { minifyJSON, tryParseJson } from 'lib/helpers'
import { compact, isEqual, isNull, isString, omitBy } from 'lodash'
import type { Dictionary } from 'types'

import { ForeignKey } from '../ForeignKeySelector/ForeignKeySelector.types'
import {
  DATETIME_TYPES,
  JSON_TYPES,
  TEXT_TYPES,
  TIMESTAMP_TYPES,
  TIME_TYPES,
} from '../SidePanelEditor.constants'
import type { RowField } from './RowEditor.types'

const getRowValue = ({ column, row }: { column: PostgresColumn; row?: Dictionary<any> }) => {
  const isNewRow = row === undefined

  if (isNewRow) {
    if (TEXT_TYPES.includes(column.format)) {
      return null
    } else if (column.format === 'bool') {
      if (column.default_value) {
        return column.default_value
      } else if (column.is_nullable) {
        return 'null'
      } else return null
    } else {
      return ''
    }
  } else {
    if (column.format === 'bool' && row[column.name] === null) {
      return 'null'
    }

    return DATETIME_TYPES.includes(column.format)
      ? convertPostgresDatetimeToInputDatetime(column.format, row[column.name])
      : parseValue(row[column.name], column.format)
  }
}

export const generateRowFields = (
  row: Dictionary<any> | undefined,
  table: PostgresTable,
  foreignKeys: ForeignKey[]
): RowField[] => {
  const { primary_keys = [] } = table
  const primaryKeyColumns = primary_keys.map((key) => key.name)

  return (table.columns ?? []).map((column) => {
    const value = getRowValue({ column, row })
    const foreignKey = foreignKeys.find((fk) => {
      return fk.columns.map((x) => x.source).includes(column.name)
    })

    return {
      value,
      foreignKey:
        foreignKey !== undefined
          ? ({
              id: foreignKey.id,
              constraint_name: foreignKey.name,
              source_schema: column.schema,
              source_table_name: column.table,
              source_column_name: column.name,
              target_table_schema: foreignKey.schema,
              target_table_name: foreignKey.table,
              target_column_name:
                foreignKey.columns.find((c) => c.source === column.name)?.target ?? '',
            } as PostgresRelationship)
          : undefined,
      id: column.id,
      name: column.name,
      comment: parseDescription(column.comment),
      format: column.format,
      enums: column.enums as any,
      defaultValue: column?.default_value as string | null,
      isNullable: column.is_nullable,
      isIdentity: column.is_identity,
      isPrimaryKey: primaryKeyColumns.includes(column.name),
    }
  })
}

export const validateFields = (fields: RowField[]) => {
  const errors = {} as any
  fields.forEach((field) => {
    const isArray = field.format.startsWith('_')

    if (isArray && field.value) {
      try {
        JSON.parse(field.value)
      } catch {
        errors[field.name] = 'Value is an invalid array'
      }
    }
    if (field.format.includes('json') && (field.value?.length ?? 0) > 0) {
      const isTruncated = isValueTruncated(field.value)
      // don't validate if the value is truncated
      if (isTruncated) return

      try {
        minifyJSON(field.value ?? '')
      } catch {
        errors[field.name] = 'Value is invalid JSON'
      }
    }
    if (field.isIdentity || field.defaultValue) return
  })
  return errors
}

export const parseValue = (originalValue: any, format: string) => {
  try {
    if (
      originalValue === null ||
      (typeof originalValue === 'string' && originalValue.length === 0)
    ) {
      return originalValue
    } else if (typeof originalValue === 'number' || !format) {
      return originalValue
    } else if (format === 'bytea') {
      return convertByteaToHex(originalValue)
    } else if (typeof originalValue === 'object') {
      return JSON.stringify(originalValue)
    } else if (typeof originalValue === 'boolean') {
      return originalValue.toString()
    } else {
      return originalValue
    }
  } catch (error) {
    return originalValue
  }
}

const parseDescription = (description: string | null) => {
  // [Joshen] Definitely can find a better way to parse the description, but this suffices for now
  if (!description) return ''
  const commentLines = compact(description.split('\n'))
  if (commentLines.length == 1) {
    // Only user comment
    return description
  } else if (commentLines.length == 2) {
    // Only swagger comment
    return `${commentLines[0]} ${commentLines[1]?.split('.<')[0]}`
  } else if (commentLines.length > 2) {
    // Both user and swagger comment
    return `${commentLines[0]} (${commentLines[1]} ${commentLines[2]?.split('.<')[0]})`
  } else {
    return ''
  }
}

const convertPostgresDatetimeToInputDatetime = (format: string, value: string) => {
  if (!value || value.length == 0) return ''
  if (TIMESTAMP_TYPES.includes(format)) {
    return dayjs(value).format('YYYY-MM-DDTHH:mm:ss')
  } else if (TIME_TYPES.includes(format)) {
    const serverTimeFormat = value && value.includes('+') ? 'HH:mm:ssZZ' : 'HH:mm:ss'
    return dayjs(value, serverTimeFormat).format('HH:mm:ss')
  } else {
    return value
  }
}

const convertInputDatetimeToPostgresDatetime = (format: string, value: string | null) => {
  if (!value || value.length == 0) return null

  switch (format) {
    case 'timestamptz':
      return dayjs(value, 'YYYY-MM-DDTHH:mm:ss').format('YYYY-MM-DDTHH:mm:ssZ')
    case 'timestamp':
      return dayjs(value, 'YYYY-MM-DDTHH:mm:ss').format('YYYY-MM-DDTHH:mm:ss')
    case 'timetz':
      return dayjs(value, 'HH:mm:ss').format('HH:mm:ssZZ')
    case 'time':
      return dayjs(value, 'HH:mm:ss').format('HH:mm:ss')
    default:
      return value
  }
}

// [Joshen] JFYI this presents a small problem in particular when creating a new row
// given that we don't include null properties. Because of that if the column has a default
// value, the column value will then always be the default value, instead of null
// which may be considered a bug if e.g for a boolean column the user specifically selects "NULL" option
// This would probably also apply to other column types like numbers (e.g user specifically wants a null value)
export const generateRowObjectFromFields = (
  fields: RowField[],
  includeNullProperties = false
): object => {
  const rowObject = {} as any
  fields.forEach((field) => {
    const isArray = field.format.startsWith('_')

    // Do not convert empty field inputs to NULL for text types
    // so that we discern NULL and EMPTY
    const value = TEXT_TYPES.includes(field.format)
      ? field.value
      : (field?.value ?? '').length === 0
        ? null
        : field.value

    if (isArray && value !== null) {
      rowObject[field.name] = tryParseJson(value)
    } else if (field.format.includes('json')) {
      if (typeof field.value === 'object') {
        rowObject[field.name] = value
      } else if (isString(value)) {
        rowObject[field.name] = tryParseJson(value)
      }
    } else if (field.format === 'bool' && value) {
      if (value === 'null') rowObject[field.name] = null
      else rowObject[field.name] = value === 'true'
    } else if (DATETIME_TYPES.includes(field.format)) {
      // Seconds are missing if they are set to 0 in the HTML input
      // Need to format that first, before passing to dayjs
      const timeSegments = (value || '').split(':')
      const formattedValue = timeSegments.length === 2 ? `${value}:00` : value
      rowObject[field.name] = convertInputDatetimeToPostgresDatetime(field.format, formattedValue)
    } else {
      rowObject[field.name] = value
    }
  })
  return includeNullProperties ? rowObject : omitBy(rowObject, isNull)
}

export const generateUpdateRowPayload = (originalRow: any, fields: RowField[]) => {
  const includeNullProperties = true
  const rowObject = generateRowObjectFromFields(fields, includeNullProperties) as any

  const payload = {} as any
  const properties = Object.keys(rowObject)
  properties.forEach((property) => {
    const field = fields.find((x) => x.name === property)
    const type = field?.format
    if (type !== undefined && DATETIME_TYPES.includes(type)) {
      // Just to ensure that the value are in the correct and consistent format for value comparison
      const originalFormatted = convertPostgresDatetimeToInputDatetime(type, originalRow[property])
      const originalFormattedOut = convertInputDatetimeToPostgresDatetime(type, originalFormatted)
      if (originalFormattedOut !== rowObject[property]) {
        payload[property] = rowObject[property]
      }
    } else if (type !== undefined && JSON_TYPES.includes(type)) {
      // don't update if the value is truncated. This is to enable the user to change cell values on rows which have
      // truncated JSON values. If the user
      const isTruncated = isValueTruncated(field?.value)
      if (!isTruncated) {
        payload[property] = rowObject[property]
      }
    } else {
      const originalValue = originalRow[property] === undefined ? null : originalRow[property]
      const newValue = rowObject[property]
      if (!isEqual(originalValue, newValue)) {
        payload[property] = newValue
      }
    }
  })

  return payload
}

/**
 * Checks if the value is truncated. The JSON types are usually truncated if they're too big to show in the editor.
 */
export const isValueTruncated = (value: string | null | undefined) => {
  return (
    (typeof value === 'string' && value.endsWith('...') && value.length > MAX_CHARACTERS) ||
    // if the value is an array which total representation is > MAX_CHARACTERS
    // we'll select the first MAX_ARRAY_SIZE elements and add a "..." last element at the end of it
    (typeof value === 'string' &&
      // If the string represent an array finishing with "..." element
      value.startsWith('["') &&
      value.endsWith(',"..."]') &&
      // If the array have MAX_ARRAY_SIZE elements in it
      // its a large truncated array
      (value.match(/","/g) || []).length === MAX_ARRAY_SIZE) ||
    // if the string represent a multi-dimentional array we always consider it as possibly truncated
    // so user load the whole value before edition
    (typeof value === 'string' && value.startsWith('[["')) ||
    // [Joshen] For json arrays, refer to getTableRowsSql from table-row-query
    // for array types, we're adding {"truncated": true} as the last item of the JSON to
    // maintain the JSON array structure
    (typeof value === 'string' && value.endsWith(',{"truncated":true}]'))
  )
}

export const convertByteaToHex = (value: { type: 'Buffer'; data: number[] }) => {
  // [Alaister] this is just a safeguard to catch sneaky null values
  try {
    return `\\x${Buffer.from(value.data).toString('hex')}`
  } catch {
    return value
  }
}
