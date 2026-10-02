import { literal } from 'pg-format'
import type { SQLQueryPropsWithSchemaFilterAndIdsFilter } from './common.js'

export const CONFIG_SQL = (props: SQLQueryPropsWithSchemaFilterAndIdsFilter) => /* SQL */ `
SELECT
  name,
  setting,
  category,
  TRIM(split_part(category, '/', 1)) AS group,
  TRIM(split_part(category, '/', 2)) AS subgroup,
  unit,
  short_desc,
  extra_desc,
  context,
  vartype,
  source,
  min_val,
  max_val,
  enumvals,
  boot_val,
  reset_val,
  sourcefile,
  sourceline,
  pending_restart
FROM
  pg_settings
ORDER BY
  category,
  name
${props.limit ? `limit ${literal(props.limit)}` : ''}
${props.offset ? `offset ${literal(props.offset)}` : ''}
`
