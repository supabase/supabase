import {
  ident,
  joinSqlFragments,
  keyword,
  literal,
  safeSql,
  type SafeSqlFragment,
} from '../../../pg-format'
import { PGTrigger, PGTriggerCreate } from '../../../pg-meta-triggers'

// [Joshen] Writing this query within FE as the PATCH endpoint from pg-meta only supports updating
// trigger name and enabled mode. So we'll delete and create the trigger, within a single transaction
// Copying the SQL from https://github.com/supabase/postgres-meta/blob/master/src/lib/PostgresMetaTriggers.ts
export function getDatabaseTriggerUpdateSQL({
  originalTrigger,
  updatedTrigger,
}: {
  originalTrigger: {
    id: number
    table_id: number
    enabled_mode: 'ORIGIN' | 'REPLICA' | 'ALWAYS' | 'DISABLED'
    name: string
    table: string
    schema: string
    condition: string | null
    orientation: 'ROW' | 'STATEMENT'
    activation: 'BEFORE' | 'AFTER' | 'INSTEAD OF'
    events: Array<string>
    function_schema: string
    function_name: string
    function_args: Array<string>
  }
  updatedTrigger: Omit<PGTriggerCreate, 'events'> &
    Pick<PGTrigger, 'enabled_mode'> & { events: Array<SafeSqlFragment> }
}): SafeSqlFragment {
  const { name, activation, events, schema, table, function_schema, function_name, function_args } =
    updatedTrigger
  const eventsList = joinSqlFragments(events, ' OR ')
  const argsList =
    function_args && function_args.length > 0
      ? joinSqlFragments(function_args.map(literal), ',')
      : safeSql``
  return safeSql`BEGIN;
DROP TRIGGER ${ident(originalTrigger.name)} ON ${ident(originalTrigger.schema)}.${ident(originalTrigger.table)};
CREATE TRIGGER ${ident(name)} ${keyword(activation)} ${eventsList} ON ${ident(schema)}.${ident(table)}
  FOR EACH ROW EXECUTE FUNCTION
  ${ident(function_schema)}.${ident(function_name)}(${argsList});
COMMIT;`
}
