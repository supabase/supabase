import { ident, joinSqlFragments, keyword, safeSql, type SafeSqlFragment } from '@supabase/pg-meta'

import type { DatabaseTriggersData } from '@/data/database-triggers/database-triggers-query'

export type PostgresTrigger = Omit<
  DatabaseTriggersData[number],
  'function_args' | 'condition' | 'events'
> & {
  function_args: SafeSqlFragment[]
  condition: SafeSqlFragment | null
  events: SafeSqlFragment[]
}

export const generateTriggerCreateSQL = (trigger: PostgresTrigger): SafeSqlFragment => {
  const events = joinSqlFragments(trigger.events, ' OR ')
  const args =
    trigger.function_args.length > 0
      ? safeSql`(${joinSqlFragments(trigger.function_args, ', ')})`
      : safeSql`()`

  // Note: CREATE OR REPLACE is not supported for triggers
  // We need to drop the existing trigger first if we want to replace it
  let sql = safeSql`
DROP TRIGGER IF EXISTS ${ident(trigger.name)} ON ${ident(trigger.schema)}.${ident(trigger.table)};

CREATE TRIGGER ${ident(trigger.name)}
${keyword(trigger.activation)} ${events}
ON ${ident(trigger.schema)}.${ident(trigger.table)}
FOR EACH ${keyword(trigger.orientation)}
`

  if (trigger.condition) {
    sql = safeSql`${sql} WHEN (${trigger.condition})\n`
  }

  sql = safeSql`${sql} EXECUTE FUNCTION ${ident(trigger.function_schema)}.${ident(trigger.function_name)}${args};`

  return sql
}

export const getDatabaseFunctionsHref = (
  projectRef: string | null | undefined,
  schema: string | null | undefined,
  name: string | null | undefined
): string => {
  return `/project/${projectRef ?? ''}/database/functions?search=${encodeURIComponent(
    name ?? ''
  )}&schema=${encodeURIComponent(schema ?? '')}`
}
