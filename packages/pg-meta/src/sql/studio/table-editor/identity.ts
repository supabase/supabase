export const getUpdateIdentitySequenceSQL = ({
  schema,
  table,
  column,
}: {
  schema: string
  table: string
  column: string
}) => {
  return `SELECT setval('"${schema}"."${table}_${column}_seq"', (SELECT COALESCE(MAX("${column}"), 1) FROM "${schema}"."${table}"))`
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
  return `SELECT setval('"${sourceTableSchema}"."${duplicatedTableName}_${columnName}_seq"', (SELECT MAX("${columnName}") FROM "${sourceTableSchema}"."${sourceTableName}"));`
}
