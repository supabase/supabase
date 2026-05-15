import { FOREIGN_KEY_CASCADE_ACTION, ident, safeSql, type SafeSqlFragment } from '@supabase/pg-meta'
import type { PGColumn } from '@supabase/pg-meta'
import { isNull } from 'lodash'
import { toast } from 'sonner'

import {
  ColumnField,
  CreateColumnPayload,
  ExtendedPostgresRelationship,
  UpdateColumnPayload,
} from '../SidePanelEditor.types'
import type { ForeignKeyConstraint } from '@/data/database/foreign-key-constraints-query'
import type { RetrieveTableResult } from '@/data/tables/table-retrieve-query'
import { uuidv4 } from '@/lib/helpers'
import type { SafePostgresColumn } from '@/lib/postgres-types'
import { trimSafeSqlFragment } from '@/lib/sql'
import type { DeepReadonly } from '@/lib/type-helpers'
import type { Dictionary } from '@/types'

// Schemas where types are considered "unqualified" — matches the ColumnType dropdown convention,
// which omits formatSchema for built-in (pg_catalog) and public types.
const isImplicitTypeSchema = (schema: string | undefined) =>
  schema === 'public' || schema === 'pg_catalog'

export const normalizeFormatSchema = (schema: string | undefined): string | undefined =>
  isImplicitTypeSchema(schema) ? undefined : schema

export const displayColumnType = (
  format: string,
  formatSchema: string | undefined,
  isArray?: boolean
): string => {
  const bareFormat = isArray && format.startsWith('_') ? format.slice(1) : format
  const normalized = normalizeFormatSchema(formatSchema)
  const qualified = normalized ? `${normalized}.${bareFormat}` : bareFormat
  return isArray ? `${qualified}[]` : qualified
}

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

export const generateColumnField = (
  field: {
    name?: string
    table?: string
    schema?: string
    format?: string
    formatSchema?: string
  } = {}
): ColumnField => {
  const { name, table, schema, format, formatSchema } = field
  return {
    id: uuidv4(),
    name: name || '',
    table: table || '',
    schema: schema || '',
    comment: '',
    format: format || '',
    formatSchema,
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

// SafePostgresColumn (the type carried through Studio state) doesn't expose the type's schema,
// but the column row returned by pg-meta's tables.retrieve does. Look it up by id.
const lookupFormatSchema = (
  column: DeepReadonly<SafePostgresColumn>,
  table: RetrieveTableResult
): string | undefined => table.columns?.find((c) => c.id === column.id)?.format_schema

export const generateColumnFieldFromPGColumn = (
  column: DeepReadonly<SafePostgresColumn>,
  table: RetrieveTableResult,
  foreignKeys: ForeignKeyConstraint[]
): ColumnField => {
  const { primary_keys } = table
  const primaryKeyColumns = primary_keys.map((key) => key.name)
  const foreignKey = getColumnForeignKey(column, table, foreignKeys)
  const isArray = column?.data_type === 'ARRAY'

  return {
    foreignKey,
    id: column?.id ?? uuidv4(),
    table: column.table,
    schema: column.schema,
    name: column.name,
    comment: column?.comment,
    format: isArray ? column.format.slice(1) : column.format,
    formatSchema: normalizeFormatSchema(lookupFormatSchema(column, table)),
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
  table: RetrieveTableResult,
  field: ColumnField
): CreateColumnPayload => {
  const isIdentity = field.format.includes('int') ? field.isIdentity : false
  const defaultValue = field.defaultValue
  const payload: CreateColumnPayload = {
    schema: table.schema,
    table: table.name,
    isIdentity,
    name: field.name.trim(),
    comment: field.comment?.trim(),
    type: { schema: field.formatSchema, name: field.format, isArray: field.isArray },
    check: trimSafeSqlFragment(field.check) ?? undefined,
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
          isNull(defaultValue) || isSQLExpression(defaultValue) ? 'expression' : 'literal',
      }),
  }
  return payload
}

export const generateUpdateColumnPayload = (
  originalColumn: DeepReadonly<SafePostgresColumn>,
  table: RetrieveTableResult,
  field: ColumnField
): Partial<UpdateColumnPayload> => {
  const primaryKeyColumns = table.primary_keys.map((key) => key.name)
  const isOriginallyPrimaryKey = primaryKeyColumns.includes(originalColumn.name)

  // Only append the properties which are getting updated
  const name = field.name.trim()
  const comment = field.comment?.trim()
  const check = trimSafeSqlFragment(field.check) ?? undefined

  const payload: Partial<UpdateColumnPayload> = {}
  // [Joshen] Trimming on the original name as well so we don't rename columns that already
  // contain whitespaces (and accidentally bringing user apps down)
  if (originalColumn.name.trim() !== name) {
    payload.name = name
  }
  if (originalColumn.comment?.trim() !== comment) {
    payload.comment = comment
  }
  if (originalColumn.check?.trim() !== check) {
    payload.check = check
  }

  const originalIsArray = originalColumn.data_type === 'ARRAY'
  const originalFormat = originalIsArray
    ? originalColumn.format.replace(/^_/, '')
    : originalColumn.format
  const originalFormatSchema = normalizeFormatSchema(lookupFormatSchema(originalColumn, table))
  if (
    originalFormat !== field.format ||
    originalFormatSchema !== field.formatSchema ||
    originalIsArray !== field.isArray
  ) {
    payload.type = { schema: field.formatSchema, name: field.format, isArray: field.isArray }
  }

  if (originalColumn.default_value !== field.defaultValue) {
    const defaultValue = field.defaultValue
    payload.defaultValue = defaultValue as unknown as Record<string, never> | undefined
    payload.defaultValueFormat =
      isNull(defaultValue) || isSQLExpression(defaultValue) ? 'expression' : 'literal'
  }
  if (originalColumn.is_identity !== field.isIdentity) {
    payload.isIdentity = field.isIdentity
  }
  if (originalColumn.is_nullable !== field.isNullable) {
    payload.isNullable = field.isNullable
  }
  if (originalColumn.is_unique !== field.isUnique) {
    payload.isUnique = field.isUnique
  }
  if (isOriginallyPrimaryKey !== field.isPrimaryKey) {
    payload.isPrimaryKey = field.isPrimaryKey
  }

  return payload
}

export const validateFields = (field: ColumnField) => {
  const errors = {} as Dictionary<string>
  if (field.name.length === 0) {
    errors['name'] = `Please assign a name for your column`
    toast.error(errors['name'])
  }
  if (field.format.length === 0) {
    errors['format'] = `Please select a type for your column`
    toast.error(errors['format'])
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
  column: DeepReadonly<PGColumn>,
  table: RetrieveTableResult,
  foreignKeys: ForeignKeyConstraint[]
) => {
  const { relationships } = table

  const foreignKey = relationships.find((relationship) => {
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

export const getPlaceholderText = (format?: string, columnFieldName?: string): SafeSqlFragment => {
  const col = ident(columnFieldName || 'column_name')

  switch (format) {
    case 'int2':
    case 'int4':
    case 'int8':
    case 'numeric':
      return safeSql`${col} > 0`

    case 'float4':
    case 'float8':
      return safeSql`${col} > 0.0`

    case 'text':
    case 'varchar':
      return safeSql`length(${col}) <= 50`

    case 'json':
    case 'jsonb':
      return safeSql`jsonb_typeof(${col}->'active') = 'boolean'`

    case 'bool':
      return safeSql`${col} in (true, false)`

    case 'date':
      return safeSql`${col} > '2024-01-01'`

    case 'time':
      return safeSql`${col} between '09:00:00' and '12:00:00'`

    case 'timetz':
      return safeSql`${col} at time zone 'UTC' between '09:00:00+00' and '17:00:00+00'`

    case 'uuid':
      return safeSql`${col} '00000000-0000-0000-0000-000000000000'`

    case 'timestamp':
      return safeSql`${col} > '2023-01-01 00:00' and ${col} < '2025-01-01 00:00'`
    case 'timestamptz':
      return safeSql`${col} > '2023-01-01 00:00:00+00' and ${col} < '2025-01-01 00:00:00+00'`

    default:
      return safeSql`length(${col}) < 500`
  }
}
