import { find, isUndefined, isEqual, isNull } from 'lodash'
import { Dictionary } from 'components/grid'
import {
  PostgresColumn,
  PostgresRelationship,
  PostgresTable,
  PostgresType,
} from '@supabase/postgres-meta'

import { uuidv4 } from 'lib/helpers'
import { ColumnField, CreateColumnPayload, UpdateColumnPayload } from '../SidePanelEditor.types'

const isSQLExpression = (input: string) => {
  if (input[0] === '(' && input[input.length - 1] === ')') {
    return true
  }

  const openParanthesisIndex = input.indexOf('(')
  const closeParanthesisIndex = input.indexOf(')')

  const hasSpaces = input.indexOf(' ') >= 0
  if (!hasSpaces && openParanthesisIndex >= 0 && closeParanthesisIndex > openParanthesisIndex) {
    return true
  }

  return false
}

export const generateColumnField = (field: any = {}): ColumnField => {
  const { name, format } = field
  return {
    id: uuidv4(),
    name: name || '',
    comment: '',
    format: format || '',
    defaultValue: null,
    foreignKey: undefined,
    isNullable: true,
    isUnique: false,
    isArray: false,
    isPrimaryKey: false,
    isIdentity: false,
    isNewColumn: true,
  }
}

export const generateColumnFieldFromPostgresColumn = (
  column: PostgresColumn,
  table: PostgresTable
): ColumnField => {
  const { primary_keys } = table
  // @ts-ignore
  const primaryKeyColumns = primary_keys.map((key) => key.name)
  const foreignKey = getColumnForeignKey(column, table)
  const isArray = column?.data_type === 'ARRAY'

  return {
    foreignKey,
    id: column?.id ?? uuidv4(),
    name: column.name,
    comment: column?.comment ?? '',
    format: isArray ? column.format.slice(1) : column.format,
    defaultValue: unescapeLiteral(column?.default_value as string),
    isArray: isArray,
    isNullable: column.is_nullable,
    isIdentity: column.is_identity,
    isUnique: column.is_unique,

    isNewColumn: false,
    isPrimaryKey: primaryKeyColumns.includes(column.name),
  }
}

export const generateCreateColumnPayload = (
  tableId: number,
  field: ColumnField
): CreateColumnPayload => {
  const isIdentity = field.format.includes('int') ? field.isIdentity : false
  const defaultValue = field.defaultValue
  const payload: CreateColumnPayload = {
    tableId,
    isIdentity,
    name: field.name,
    comment: field.comment,
    type: field.isArray ? `${field.format}[]` : field.format,
    isUnique: field.isUnique,
    isPrimaryKey: field.isPrimaryKey,
    ...(!field.isPrimaryKey && !isIdentity && { isNullable: field.isNullable }),
    ...(!isIdentity && {
      defaultValue:
        field.isArray && defaultValue ? formatArrayToPostgresArray(defaultValue) : defaultValue,
    }),
    ...(!isIdentity &&
      defaultValue && {
        defaultValueFormat:
          isNull(defaultValue) || isSQLExpression(defaultValue)
            ? 'expression'
            : ('literal' as 'expression' | 'literal'),
      }),
  }
  return payload
}

export const generateUpdateColumnPayload = (
  originalColumn: PostgresColumn,
  field: ColumnField
): Partial<UpdateColumnPayload> => {
  // Only append the properties which are getting updated
  const defaultValue = field.defaultValue
  const type = field.isArray ? `${field.format}[]` : field.format
  const comment = (field.comment?.length ?? '') === 0 ? null : field.comment

  const payload: Partial<UpdateColumnPayload> = {}
  if (!isEqual(originalColumn.name, field.name)) {
    payload.name = field.name
  }
  if (!isEqual(originalColumn.comment, comment)) {
    payload.comment = comment
  }
  if (!isEqual(originalColumn.format, type)) {
    payload.type = type
  }
  if (!isEqual(unescapeLiteral(originalColumn.default_value as string), defaultValue)) {
    payload.defaultValue = defaultValue
    payload.defaultValueFormat =
      isNull(defaultValue) || isSQLExpression(defaultValue)
        ? 'expression'
        : ('literal' as 'expression' | 'literal')
  }
  if (!isEqual(originalColumn.is_identity, field.isIdentity)) {
    payload.isIdentity = field.isIdentity
  }
  if (!isEqual(originalColumn.is_nullable, field.isNullable)) {
    payload.isNullable = field.isNullable
  }
  if (!isEqual(originalColumn.is_unique, field.isUnique)) {
    payload.isUnique = field.isUnique
  }

  return payload
}

export const getSelectedEnumValues = (type: string, enums: PostgresType[]) => {
  const enumType = find(enums, { name: type })
  return (enumType?.enums ?? []) as string[]
}

export const validateFields = (field: ColumnField) => {
  const errors = {} as Dictionary<any>
  if (field.name.length === 0) {
    errors['name'] = `Please assign a name for your column`
  }
  if (field.format.length === 0) {
    errors['format'] = `Please select a type for your column`
  }
  return errors
}

export const getForeignKeyUIState = (
  originalConfig: PostgresRelationship | undefined,
  updatedConfig: PostgresRelationship | undefined
): 'Info' | 'Add' | 'Remove' | 'Update' => {
  if (isUndefined(originalConfig) && !isUndefined(updatedConfig)) {
    return 'Add'
  }

  if (!isUndefined(originalConfig) && isUndefined(updatedConfig)) {
    return 'Remove'
  }

  if (
    !isEqual(originalConfig?.target_table_schema, updatedConfig?.target_table_schema) ||
    !isEqual(originalConfig?.target_table_name, updatedConfig?.target_table_name) ||
    !isEqual(originalConfig?.target_column_name, updatedConfig?.target_column_name)
  ) {
    return 'Update'
  }

  return 'Info'
}

export const getColumnForeignKey = (column: PostgresColumn, table: PostgresTable) => {
  const { relationships } = table
  return find(relationships, (relationship) => {
    return (
      relationship.source_schema === column.schema &&
      relationship.source_table_name === column.table &&
      relationship.source_column_name === column.name
    )
  })
}

// Assumes arrayString is a stringified array (e.g "[1, 2, 3]")
const formatArrayToPostgresArray = (arrayString: string) => {
  if (!arrayString) return null
  return arrayString.replaceAll('[', '{').replaceAll(']', '}')
}

export const unescapeLiteral = (value: string) => {
  if (!value) return value

  // Handle combinations - this is really not the best solution imo
  // It's a log(n) attempt to strip off the ::type strings
  if (value.includes('||')) {
    const formattedValue = []
    let found = false
    for (let i = 0; i < value.length; i++) {
      if (value[i] === ':') found = true
      if (((value[i] === ' ' || value[i] === ')') && found) || i === value.length - 1) found = false
      if (!found) formattedValue.push(value[i])
    }
    return formattedValue.join('')
  }

  const splits = value.split("'::")
  if (splits.length <= 1) return value

  // Handle timezones
  if (value.toLowerCase().includes('time zone')) {
    return `${splits[0].toLowerCase()}')`
  }

  // Handle json
  if (value.toLowerCase().includes('json')) {
    return splits[0].slice(1)
  }

  let temp = splits[0].slice(1).replace("'{", '{')
  if (
    value.endsWith('integer[]') ||
    value.endsWith('real[]') ||
    value.endsWith('bigint[]') ||
    value.endsWith('smallint[]')
  ) {
    temp = temp.replace(/{/g, '[')
    temp = temp.replace(/}/g, ']')
    return temp
  } else {
    const matches = temp.match(/\{([^{}]+)\}/g)
    if (matches) {
      const array = [...matches]
      array.forEach((x) => {
        let _x = x.replace(/{/g, '{"')
        _x = _x.replace(/}/g, '"}')
        _x = _x.replace(/,/g, '","')
        temp = temp.replace(x, _x)
      })
      temp = temp.replace(/{/g, '[')
      temp = temp.replace(/}/g, ']')
    }
    return temp
  }
}
