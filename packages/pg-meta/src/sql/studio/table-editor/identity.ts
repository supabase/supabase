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
  return safeSql`WITH sequence_reference AS (
  SELECT pg_get_serial_sequence(${literal(`${schema}.${table}`)}, ${literal(column)}) AS sequence_name
)
SELECT setval(
  sequence_reference.sequence_name,
  COALESCE((SELECT MAX(${ident(column)}) FROM ${ident(schema)}.${ident(table)}), 1)
)
FROM sequence_reference
WHERE sequence_reference.sequence_name IS NOT NULL`
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
