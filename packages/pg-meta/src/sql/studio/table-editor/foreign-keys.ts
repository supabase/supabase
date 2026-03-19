import { ident } from '../../../pg-format'

export const getAddForeignKeySQL = ({
  table,
  foreignKeys,
}: {
  table: { schema: string; name: string }
  foreignKeys: ForeignKey[]
}) => {
  const getOnDeleteSql = (action: string) =>
    action === FOREIGN_KEY_CASCADE_ACTION.CASCADE
      ? 'ON DELETE CASCADE'
      : action === FOREIGN_KEY_CASCADE_ACTION.RESTRICT
        ? 'ON DELETE RESTRICT'
        : action === FOREIGN_KEY_CASCADE_ACTION.SET_DEFAULT
          ? 'ON DELETE SET DEFAULT'
          : action === FOREIGN_KEY_CASCADE_ACTION.SET_NULL
            ? 'ON DELETE SET NULL'
            : ''
  const getOnUpdateSql = (action: string) =>
    action === FOREIGN_KEY_CASCADE_ACTION.CASCADE
      ? 'ON UPDATE CASCADE'
      : action === FOREIGN_KEY_CASCADE_ACTION.RESTRICT
        ? 'ON UPDATE RESTRICT'
        : ''
  return (
    foreignKeys
      .map((relation) => {
        const { deletionAction, updateAction } = relation
        const onDeleteSql = getOnDeleteSql(deletionAction)
        const onUpdateSql = getOnUpdateSql(updateAction)
        return `
      ALTER TABLE ${ident(table.schema)}.${ident(table.name)}
      ADD FOREIGN KEY (${relation.columns.map((column) => ident(column.source)).join(', ')})
      REFERENCES ${ident(relation.schema)}.${ident(relation.table)} (${relation.columns.map((column) => ident(column.target)).join(', ')})
      ${onUpdateSql}
      ${onDeleteSql}
    `
          .replace(/\s+/g, ' ')
          .trim()
      })
      .join(';') + ';'
  )
}

export const getRemoveForeignKeySQL = ({
  table,
  foreignKeys,
}: {
  table: { schema: string; name: string }
  foreignKeys: ForeignKey[]
}) => {
  return (
    foreignKeys
      .map((relation) =>
        `
ALTER TABLE IF EXISTS ${ident(table.schema)}.${ident(table.name)}
DROP CONSTRAINT IF EXISTS ${ident(relation.name)}
`
          .replace(/\s+/g, ' ')
          .trim()
      )
      .join(';') + ';'
  )
}

export interface ForeignKey {
  id?: number | string
  name?: string
  tableId?: number

  schema: string
  table: string
  columns: { source: string; sourceType?: string; target: string; targetType?: string }[]
  deletionAction: string
  updateAction: string
  toRemove?: boolean
}

export enum FOREIGN_KEY_CASCADE_ACTION {
  NO_ACTION = 'a',
  RESTRICT = 'r',
  CASCADE = 'c',
  SET_NULL = 'n',
  SET_DEFAULT = 'd',
}
