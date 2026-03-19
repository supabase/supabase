import { ident, literal } from '../../../pg-format'

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
    `CREATE TABLE ${ident(sourceTableSchema)}.${ident(duplicatedTableName)} (LIKE ${ident(sourceTableSchema)}.${ident(sourceTableName)} INCLUDING ALL);`,
    comment != undefined
      ? `comment on table ${ident(sourceTableSchema)}.${ident(duplicatedTableName)} is ${literal(comment)};`
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
  return `INSERT INTO ${ident(sourceTableSchema)}.${ident(duplicatedTableName)} SELECT * FROM ${ident(sourceTableSchema)}.${ident(sourceTableName)};`
}
