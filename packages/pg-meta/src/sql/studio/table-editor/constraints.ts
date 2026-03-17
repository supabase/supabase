import { ident } from '../../../pg-format'

export const getDropConstraintSQL = ({
  schema,
  table,
  name,
}: {
  schema: string
  table: string
  name: string
}) => `ALTER TABLE ${ident(schema)}.${ident(table)} DROP CONSTRAINT ${ident(name)}`
