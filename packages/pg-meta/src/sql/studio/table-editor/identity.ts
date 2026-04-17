import { ident, literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getUpdateIdentitySequenceSQL = ({
  schema,
  table,
  column,
}: {
  schema: string
  table: string
  column: string
}): SafeSqlFragment => {
  return safeSql`SELECT setval(${literal(`${ident(schema)}.${ident(`${table}_${column}_seq`)}`)}::regclass, (SELECT COALESCE(MAX(${ident(column)}), 1) FROM ${ident(schema)}.${ident(table)}))`
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
}): SafeSqlFragment => {
  return safeSql`SELECT setval(${literal(`${ident(sourceTableSchema)}.${ident(`${duplicatedTableName}_${columnName}_seq`)}`)}::regclass, (SELECT COALESCE(MAX(${ident(columnName)}), 1) FROM ${ident(sourceTableSchema)}.${ident(sourceTableName)}));`
}
