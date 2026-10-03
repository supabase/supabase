import { literal } from 'pg-format'
import type { SQLQueryProps } from './common.js'

export const EXTENSIONS_SQL = (props: SQLQueryProps & { nameFilter?: string }) => /* SQL */ `
SELECT
  e.name,
  n.nspname AS schema,
  e.default_version,
  x.extversion AS installed_version,
  e.comment
FROM
  pg_available_extensions() e(name, default_version, comment)
  LEFT JOIN pg_extension x ON e.name = x.extname
  LEFT JOIN pg_namespace n ON x.extnamespace = n.oid
WHERE
  true
  ${props.nameFilter ? `AND e.name ${props.nameFilter}` : ''}
${props.limit ? `limit ${literal(props.limit)}` : ''}
${props.offset ? `offset ${literal(props.offset)}` : ''}
`
