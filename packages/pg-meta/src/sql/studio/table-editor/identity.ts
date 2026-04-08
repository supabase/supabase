import { ident } from '../../../pg-format'

export const getUpdateIdentitySequenceSQL = ({
  schema,
  table,
  column,
}: {
  schema: string
  table: string
  column: string
}) => {
  return `-- source: dashboard\n-- description: Reset an identity sequence to the current max value in the column\nSELECT setval('${ident(schema)}.${ident(`${table}_${column}_seq`)}', (SELECT COALESCE(MAX(${ident(column)}), 1) FROM ${ident(schema)}.${ident(table)}))`
}

export const getDuplicateIdentitySequenceSQL = ({
  columnName,
  duplicatedTableName,
  sourceTableName,
  sourceTableSchema,
}: {
  columnName: string
  duplicatedTableName: string
  sourceTableName: string
  sourceTableSchema: string
}) => {
  return `-- source: dashboard\n-- description: Sync the identity sequence of a duplicated table to match the source table's max value\nSELECT setval('${ident(sourceTableSchema)}.${ident(`${duplicatedTableName}_${columnName}_seq`)}', (SELECT COALESCE(MAX(${ident(columnName)}), 1) FROM ${ident(sourceTableSchema)}.${ident(sourceTableName)}));`
}
