import { find, isUndefined, isEqual, isNull } from 'lodash'
import { Dictionary } from 'components/grid'
import type {
  PostgresColumn,
  PostgresRelationship,
  PostgresTable,
  PostgresType,
} from '@supabase/postgres-meta'

import { uuidv4 } from 'lib/helpers'
import {
  ColumnField,
  CreateColumnPayload,
  ExtendedPostgresRelationship,
  UpdateColumnPayload,
} from '../SidePanelEditor.types'
import { FOREIGN_KEY_CASCADE_ACTION } from 'data/database/database-query-constants'
import { ForeignKeyConstraint } from 'data/database/foreign-key-constraints-query'

const isSQLExpression = (input: string) => {
  if (['CURRENT_DATE'].includes(input)) return true

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
    check: null,
    isNullable: true,
    isUnique: false,
    isArray: false,
    isPrimaryKey: false,
    isIdentity: false,
    isNewColumn: true,
    isEncrypted: false,
  }
}

export const generateColumnFieldFromPostgresColumn = (
  column: PostgresColumn,
  table: PostgresTable,
  foreignKeys: ForeignKeyConstraint[]
): ColumnField => {
  const { primary_keys } = table
  // @ts-ignore
  const primaryKeyColumns = primary_keys.map((key) => key.name)
  const foreignKey = getColumnForeignKey(column, table, foreignKeys)
  const isArray = column?.data_type === 'ARRAY'

  return {
    foreignKey,
    id: column?.id ?? uuidv4(),
    name: column.name,
    comment: column?.comment ?? '',
    format: isArray ? column.format.slice(1) : column.format,
    defaultValue: column?.default_value as string | null,
    check: column.check,
    isArray: isArray,
    isNullable: column.is_nullable,
    isIdentity: column.is_identity,
    isUnique: column.is_unique,

    isNewColumn: false,
    isEncrypted: false,
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
    check: field.check?.trim() || undefined,
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
  table: PostgresTable,
  field: ColumnField
): Partial<UpdateColumnPayload> => {
  // @ts-ignore
  const primaryKeyColumns = table.primary_keys.map((key) => key.name)
  const isOriginallyPrimaryKey = primaryKeyColumns.includes(originalColumn.name)

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
  if (!isEqual(originalColumn.check?.trim(), field.check?.trim())) {
    payload.check = field.check?.trim() || null
  }

  if (!isEqual(originalColumn.format, type)) {
    payload.type = type
  }
  if (!isEqual(originalColumn.default_value as string, defaultValue)) {
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
  if (!isEqual(isOriginallyPrimaryKey, field.isPrimaryKey)) {
    payload.isPrimaryKey = field.isPrimaryKey
  }

  return payload
}

export const validateFields = (field: ColumnField) => {
  const errors = {} as Dictionary<any>
  if (field.name.length === 0) {
    errors['name'] = `Please assign a name for your column`
  }
  if (field.format.length === 0) {
    errors['format'] = `Please select a type for your column`
  }
  if (field.isEncrypted && field.keyId === 'create-new' && (field?.keyName ?? '').length === 0) {
    errors['keyName'] = 'Please provide a name for your new key'
  }
  if (field.isEncrypted && field.format !== 'text') {
    errors['isEncrypted'] = 'Only columns of type text can be encrypted'
  }
  return errors
}

export const getForeignKeyUIState = (
  originalConfig: ExtendedPostgresRelationship | undefined,
  updatedConfig: ExtendedPostgresRelationship | undefined
): 'Info' | 'Add' | 'Remove' | 'Update' => {
  if (originalConfig === undefined && updatedConfig !== undefined) {
    return 'Add'
  }

  if (originalConfig !== undefined && updatedConfig === undefined) {
    return 'Remove'
  }

  if (
    originalConfig?.target_table_schema !== updatedConfig?.target_table_schema ||
    originalConfig?.target_table_name !== updatedConfig?.target_table_name ||
    originalConfig?.target_column_name !== updatedConfig?.target_column_name ||
    originalConfig?.deletion_action !== updatedConfig?.deletion_action ||
    originalConfig?.update_action !== updatedConfig?.update_action
  ) {
    return 'Update'
  }

  return 'Info'
}

export const getColumnForeignKey = (
  column: PostgresColumn,
  table: PostgresTable,
  foreignKeys: ForeignKeyConstraint[]
) => {
  const { relationships } = table
  const foreignKey = find(relationships, (relationship) => {
    return (
      relationship.source_schema === column.schema &&
      relationship.source_table_name === column.table &&
      relationship.source_column_name === column.name
    )
  })
  if (foreignKey === undefined) return foreignKey
  else {
    const foreignKeyMeta = foreignKeys.find((fk) => fk.id === foreignKey.id)
    return {
      ...foreignKey,
      deletion_action: foreignKeyMeta?.deletion_action ?? FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
      update_action: foreignKeyMeta?.update_action ?? FOREIGN_KEY_CASCADE_ACTION.NO_ACTION,
    }
  }
}

// Assumes arrayString is a stringified array (e.g "[1, 2, 3]")
const formatArrayToPostgresArray = (arrayString: string) => {
  if (!arrayString) return null
  return arrayString.replaceAll('[', '{').replaceAll(']', '}')
}

export const getForeignKeyCascadeAction = (action?: string) => {
  switch (action) {
    case FOREIGN_KEY_CASCADE_ACTION.CASCADE:
      return 'Cascade'
    case FOREIGN_KEY_CASCADE_ACTION.RESTRICT:
      return 'Restrict'
    case FOREIGN_KEY_CASCADE_ACTION.SET_DEFAULT:
      return 'Set default'
    case FOREIGN_KEY_CASCADE_ACTION.SET_NULL:
      return 'Set NULL'
    default:
      return undefined
  }
}
