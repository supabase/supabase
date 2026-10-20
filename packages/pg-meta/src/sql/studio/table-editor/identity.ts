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
  // Never lower the sequence, so this is safe to run even when no rows were inserted
  return safeSql`WITH sequence_reference AS (
  SELECT pg_get_serial_sequence(${literal(`${schema}.${table}`)}, ${literal(column)}) AS sequence_name
)
SELECT setval(
  sequence_reference.sequence_name,
  GREATEST(
    COALESCE((SELECT MAX(${ident(column)}) FROM ${ident(schema)}.${ident(table)}), 1),
    COALESCE(pg_sequence_last_value(sequence_reference.sequence_name::regclass), 1)
  )
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
