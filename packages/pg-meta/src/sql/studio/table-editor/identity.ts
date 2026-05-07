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
  return `SELECT setval('${ident(schema)}.${ident(`${table}_${column}_seq`)}', (SELECT COALESCE(MAX(${ident(column)}), 1) FROM ${ident(schema)}.${ident(table)}))`
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
  return `SELECT setval('${ident(sourceTableSchema)}.${ident(`${duplicatedTableName}_${columnName}_seq`)}', (SELECT COALESCE(MAX(${ident(columnName)}), 1) FROM ${ident(sourceTableSchema)}.${ident(sourceTableName)}));`
}
