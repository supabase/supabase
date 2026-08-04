import {
  ident,
  joinSqlFragments,
  keyword,
  literal,
  safeSql,
  type SafeSqlFragment,
} from '@supabase/pg-meta'

import type { DatabaseEventTrigger } from '@/data/database-event-triggers/database-event-triggers-query'

export type EventTrigger = Omit<DatabaseEventTrigger, 'function_definition'> & {
  function_definition: SafeSqlFragment | null
}

export const generateEventTriggerCreateSQL = (trigger: EventTrigger): SafeSqlFragment => {
  const parts: SafeSqlFragment[] = []

  if (trigger.function_definition) {
    const hasTrailingSemicolon = /;\s*$/.test(trigger.function_definition)
    parts.push(
      hasTrailingSemicolon ? trigger.function_definition : safeSql`${trigger.function_definition};`
    )
  }

  if (trigger.event && trigger.function_schema && trigger.function_name) {
    parts.push(safeSql`DROP EVENT TRIGGER IF EXISTS ${ident(trigger.name)};`)

    const tagClause =
      trigger.tags && trigger.tags.length > 0
        ? safeSql`\nWHEN TAG IN (${joinSqlFragments(
            trigger.tags.map((tag) => literal(tag)),
            ', '
          )})`
        : safeSql``

    parts.push(safeSql`CREATE EVENT TRIGGER ${ident(trigger.name)}
ON ${keyword(trigger.event)}${tagClause}
EXECUTE FUNCTION ${ident(trigger.function_schema)}.${ident(trigger.function_name)}();`)
  }

  return parts.length > 0 ? joinSqlFragments(parts, '\n\n') : safeSql``
}
