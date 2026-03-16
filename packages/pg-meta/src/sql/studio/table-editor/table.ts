export const getDuplicateTableSQL = ({
  comment,
  duplicatedTableName,
  sourceTableName,
  sourceTableSchema,
}: {
  comment?: string | null
  duplicatedTableName: string
  sourceTableName: string
  sourceTableSchema: string
}) => {
  return [
    `CREATE TABLE "${sourceTableSchema}"."${duplicatedTableName}" (LIKE "${sourceTableSchema}"."${sourceTableName}" INCLUDING ALL);`,
    comment != undefined
      ? `comment on table "${sourceTableSchema}"."${duplicatedTableName}" is '${comment}';`
      : '',
  ].join('\n')
}

export const getDuplicateRowsSQL = ({
  duplicatedTableName,
  sourceTableName,
  sourceTableSchema,
}: {
  duplicatedTableName: string
  sourceTableName: string
  sourceTableSchema: string
}) => {
  return `INSERT INTO "${sourceTableSchema}"."${duplicatedTableName}" SELECT * FROM "${sourceTableSchema}"."${sourceTableName}";`
}
