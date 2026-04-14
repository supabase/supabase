import { ident, literal } from '../../../pg-format'

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

export const getUpdateSerialSequenceSQL = ({
  schema,
  table,
  column,
}: {
  schema: string
  table: string
  column: string
}) => {
  // literal() wraps in single quotes safely — prevents SQL injection
  // ident() wraps in double quotes for identifiers
  const seqTable = literal(`${schema}.${table}`)
  const seqColumn = literal(column)
  const tableRef = `${ident(schema)}.${ident(table)}`
  const colRef = ident(column)

  // 3-argument setval(seq, val, is_called):
  //   is_called=true  → next nextval() returns val+1  (use when rows exist)
  //   is_called=false → next nextval() returns val itself (use when table is empty)
  return `
    SELECT CASE
      WHEN MAX(${colRef}) IS NULL
        THEN setval(pg_get_serial_sequence(${seqTable}, ${seqColumn}), 1, false)
      ELSE setval(pg_get_serial_sequence(${seqTable}, ${seqColumn}), MAX(${colRef}), true)
    END
    FROM ${tableRef}
  `.trim()
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
