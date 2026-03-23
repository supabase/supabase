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

export const getForeignKeyConstraintsSql = ({ schema }: { schema: string }) => {
  if (!schema) throw new Error('schema is required')

  const sql = /* SQL */ `
SELECT 
  con.oid as id, 
  con.conname as constraint_name, 
  con.confdeltype as deletion_action,
  con.confupdtype as update_action,
  rel.oid as source_id,
  nsp.nspname as source_schema, 
  rel.relname as source_table, 
  (
    SELECT 
      array_agg(
        att.attname 
        ORDER BY 
          un.ord
      ) 
    FROM 
      unnest(con.conkey) WITH ORDINALITY un (attnum, ord) 
      INNER JOIN pg_attribute att ON att.attnum = un.attnum 
    WHERE 
      att.attrelid = rel.oid
  ) source_columns, 
  frel.oid as target_id,
  fnsp.nspname as target_schema, 
  frel.relname as target_table, 
  (
    SELECT 
      array_agg(
        att.attname 
        ORDER BY 
          un.ord
      ) 
    FROM 
      unnest(con.confkey) WITH ORDINALITY un (attnum, ord) 
      INNER JOIN pg_attribute att ON att.attnum = un.attnum 
    WHERE 
      att.attrelid = frel.oid
  ) target_columns 
FROM 
  pg_constraint con 
  INNER JOIN pg_class rel ON rel.oid = con.conrelid 
  INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace 
  INNER JOIN pg_class frel ON frel.oid = con.confrelid 
  INNER JOIN pg_namespace fnsp ON fnsp.oid = frel.relnamespace 
WHERE 
  con.contype = 'f'
  AND nsp.nspname = '${schema}'
`.trim()

  return sql
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
