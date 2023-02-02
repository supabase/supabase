import dayjs from 'dayjs'
import { find, isUndefined, compact, isEqual, omitBy, isNull, isString } from 'lodash'
import { Dictionary } from 'components/grid'
import type { PostgresTable } from '@supabase/postgres-meta'

import { uuidv4, minifyJSON, tryParseJson } from 'lib/helpers'
import { RowField } from './RowEditor.types'
import { DATETIME_TYPES, TIME_TYPES, TIMESTAMP_TYPES } from '../SidePanelEditor.constants'

export const generateRowFields = (
  row: Dictionary<any> | undefined,
  table: PostgresTable
): RowField[] => {
  const { relationships, primary_keys } = table
  // @ts-ignore
  const primaryKeyColumns = primary_keys.map((key) => key.name)

  return table.columns!.map((column) => {
    const value = isUndefined(row)
      ? ''
      : DATETIME_TYPES.includes(column.format)
      ? convertPostgresDatetimeToInputDatetime(column.format, row[column.name])
      : parseValue(row[column.name], column.format)

    const foreignKey = find(relationships, (relationship) => {
      return (
        relationship.source_schema === column.schema &&
        relationship.source_table_name === column.table &&
        relationship.source_column_name === column.name
      )
    })

    return {
      value,
      foreignKey,
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
      try {
        minifyJSON(field.value ?? '')
      } catch {
        errors[field.name] = 'Value is an invalid JSON'
      }
    }
    if (field.isIdentity || field.defaultValue) return
  })
  return errors
}

// Currently only used in ReferenceRowViewer for rows outside of public schema
export const generateRowFieldsWithoutColumnMeta = (row: any): RowField[] => {
  const properties = Object.keys(row)
  return properties.map((property) => {
    return {
      id: uuidv4(),
      value: row[property] || '',
      name: property,
      comment: '',
      format: '',
      enums: [],
      defaultValue: '',
      foreignKey: undefined,
      isNullable: false,
      isIdentity: false,
      isPrimaryKey: false,
    }
  })
}

const parseValue = (originalValue: string, format: string) => {
  try {
    if (originalValue === null || originalValue.length === 0) {
      return originalValue
    } else if (typeof originalValue === 'number' || !format) {
      return originalValue
    } else if (typeof originalValue === 'object') {
      return JSON.stringify(originalValue)
    } else if (typeof originalValue === 'boolean') {
      return (originalValue as any).toString()
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

export const generateRowObjectFromFields = (
  fields: RowField[],
  includeNullProperties = false
): object => {
  const rowObject = {} as any
  fields.forEach((field) => {
    const isArray = field.format.startsWith('_')
    const value = (field?.value ?? '').length === 0 ? null : field.value

    if (isArray && value !== null) {
      rowObject[field.name] = tryParseJson(value)
    } else if (field.format.includes('json')) {
      if (typeof field.value === 'object') {
        rowObject[field.name] = value
      } else if (isString(value)) {
        rowObject[field.name] = tryParseJson(value)
      }
    } else if (field.format === 'bool' && value) {
      rowObject[field.name] = value === 'true'
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

export const generateUpdateRowPayload = (originalRow: any, field: RowField[]) => {
  const includeNullProperties = true
  const rowObject = generateRowObjectFromFields(field, includeNullProperties) as any

  const payload = {} as any
  const properties = Object.keys(rowObject)
  properties.forEach((property) => {
    if (!isEqual(originalRow[property], rowObject[property])) {
      payload[property] = rowObject[property]
    }
  })
  return payload
}
