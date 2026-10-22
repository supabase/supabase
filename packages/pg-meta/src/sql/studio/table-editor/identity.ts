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
  // Only moves the sequence past imported values in its own direction, so this is a no-op
  // when no rows were inserted. An unused sequence has no last value and next issues its start.
  return safeSql`WITH sequence_state AS (
  SELECT
    pg_sequence.seqrelid AS sequence_id,
    pg_sequence.seqincrement > 0 AS is_ascending,
    pg_sequence.seqstart AS start_value,
    pg_sequence_last_value(pg_sequence.seqrelid) AS last_value,
    CASE
      WHEN pg_sequence.seqincrement > 0
        THEN (SELECT MAX(${ident(column)}) FROM ${ident(schema)}.${ident(table)})
      ELSE (SELECT MIN(${ident(column)}) FROM ${ident(schema)}.${ident(table)})
    END AS imported_value
  FROM pg_sequence
  WHERE pg_sequence.seqrelid = pg_get_serial_sequence(${literal(`${schema}.${table}`)}, ${literal(column)})::regclass
)
SELECT setval(sequence_id, imported_value)
FROM sequence_state
WHERE CASE
  WHEN last_value IS NULL AND is_ascending THEN imported_value >= start_value
  WHEN last_value IS NULL THEN imported_value <= start_value
  WHEN is_ascending THEN imported_value > last_value
  ELSE imported_value < last_value
END`
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
