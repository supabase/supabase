import dayjs from 'dayjs'
import { find, isUndefined, compact, includes, isEqual, omitBy, isNull, isString } from 'lodash'
import { Dictionary } from '@supabase/grid'
import { PostgresTable } from '@supabase/postgres-meta'

import { uuidv4, minifyJSON, tryParseJson } from 'lib/helpers'
import { RowField } from './RowEditor.types'
import {
  JSON_TYPES,
  NUMERICAL_TYPES,
  DATETIME_TYPES,
  TIME_TYPES,
  TIMESTAMP_TYPES,
} from '../SidePanelEditor.constants'

export const generateRowFields = (
  row: Dictionary<any> | undefined,
  table: PostgresTable,
  isNewRecord?: boolean
): RowField[] => {
  const { relationships, primary_keys } = table
  // @ts-ignore
  const primaryKeyColumns = primary_keys.map((key) => key.name)

  return table.columns.map((column) => {
    const defaultValue = column?.default_value as string | null
    const value =
      isNewRecord && defaultValue?.includes('now()')
        ? nowDateTimeValue(column.format)
        : isUndefined(row)
        ? ''
        : DATETIME_TYPES.includes(column.format)
        ? convertPostgresDatetimeToInputDatetime(column.format, row[column.name])
        : parseValue(row[column.name], column.format, column.data_type)

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
      defaultValue: parseValue(column.default_value as string, column.format, column.data_type),
      isNullable: column.is_nullable,
      isIdentity: column.is_identity,
      isPrimaryKey: primaryKeyColumns.includes(column.name),
    }
  })
}

export const validateFields = (fields: RowField[]) => {
  const errors = {} as any
  fields.forEach((field) => {
    if (field.format.startsWith('_') && field.value?.length > 0) {
      try {
        minifyJSON(field.value)
      } catch {
        errors[field.name] = 'Invalid array'
      }
    }
    if (field.format.includes('json') && field.value?.length > 0) {
      try {
        minifyJSON(field.value)
      } catch {
        errors[field.name] = 'Invalid JSON'
      }
    }
    if (field.isIdentity || field.defaultValue) return
    if (!field.isNullable && !field.value && field.defaultValue === null) {
      errors[field.name] = `Please assign a value for this field`
    }
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

const parseValue = (originalValue: string, format: string, dataType: string) => {
  try {
    if (originalValue === null || originalValue.length === 0) {
      return originalValue
    } else if (typeof originalValue === 'number' || !format) {
      return originalValue
    } else if (typeof originalValue === 'object') {
      return JSON.stringify(originalValue)
    } else if (typeof originalValue === 'boolean') {
      return (originalValue as any).toString()
    } else if (includes(JSON_TYPES, format)) {
      const value = _unescapeLiteral(dataType, originalValue, format)
      return minifyJSON(value)
    }

    // escape literal format from postgres-meta
    const value = _unescapeLiteral(dataType, originalValue, format)
    if (dataType && dataType.toLowerCase() == 'array') {
      if (originalValue && originalValue.includes("}'::") && originalValue.endsWith('[]')) {
        // for array default value, we need to use this method to parse literal format
        // TODO: should merge with above method... if we can
        return _unescapeLiteralArray(originalValue)
      } else if (typeof value === 'string') {
        const parsedValue = JSON.parse(value)
        return JSON.parse(parsedValue)
      } else {
        return JSON.stringify(value)
      }
    } else {
      return value
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

const nowDateTimeValue = (format: string) => {
  switch (format) {
    case 'timestamptz':
      return dayjs().format('YYYY-MM-DDTHH:mm:ss')
    case 'timestamp':
      return dayjs().format('YYYY-MM-DDTHH:mm:ss')
    case 'timetz':
      return dayjs().format('HH:mm:ss')
    case 'time':
      return dayjs().format('HH:mm:ss')
    default:
      return dayjs().format('YYYY-MM-DD')
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

/**
 * postgres-meta can return default value with format like
 * 'hello world'::character varying
 * '232.34'::double precision
 * 'USER'::"Role" user-defined type
 * this method will help convert them to valid default value
 */
const _unescapeLiteral = (dataType: string, value: string, format: string): any => {
  // unEscape format literal
  let temp = `::${dataType}`
  let tempWithQuotes = `::"${dataType}"`
  // for user-defined type, need to use format instead
  if (dataType?.toLowerCase() == 'user-defined') {
    temp = `::${format}`
    tempWithQuotes = `::"${format}"`
  }

  if (value && value.includes(temp)) {
    value = value.replace(temp, '')
    // remove quotes
    value = value.slice(1, value.length - 1)
  } else if (value && value.includes(tempWithQuotes)) {
    value = value.replace(tempWithQuotes, '')
    // remove quotes
    value = value.slice(1, value.length - 1)
  }
  return value
}

/**
 * postgres-meta can return default value for array like
 * ex: '{apple,banana}'::text[] => ["apple","banana"]
 * ex: '{1,2,3,4,5,6}'::integer[] => [1,2,3,4,5,6]
 * ex: '{{meeting,lunch},{training,presentation}}'::character varying[]
 * this method will help convert them to valid default value
 */
const _unescapeLiteralArray = (value: any) => {
  const splits = value.split("'::")
  if (splits.length < 1) return value

  let temp = splits[0].replace("'{", '{')
  if (value.endsWith('integer[]') || value.endsWith('real[]')) {
    temp = temp.replaceAll('{', '[')
    temp = temp.replaceAll('}', ']')
    return temp
  } else {
    const matches = temp.match(/\{([^{}]+)\}/g)
    if (matches) {
      const array = [...matches]
      array.forEach((x) => {
        let _x = x.replaceAll('{', '{"')
        _x = _x.replaceAll('}', '"}')
        _x = _x.replaceAll(',', '","')
        temp = temp.replace(x, _x)
      })
      temp = temp.replaceAll('{', '[')
      temp = temp.replaceAll('}', ']')
    }
    return temp
  }
}

export const generateRowObjectFromFields = (
  fields: RowField[],
  includeNullProperties = false
): object => {
  const rowObject = {} as any
  fields.forEach((field) => {
    const value = (field?.value ?? '').length === 0 ? null : field.value
    if (field.format.includes('json') || (field.format.startsWith('_') && value)) {
      if (typeof field.value === 'object') {
        rowObject[field.name] = value
      } else {
        if (isString(value)) {
          rowObject[field.name] = tryParseJson(value)
        }
      }
    } else if (NUMERICAL_TYPES.includes(field.format) && value) {
      rowObject[field.name] = Number(value)
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
