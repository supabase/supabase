import { literal } from '../../../pg-format'
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
    events: string[]
    function_schema: string
    function_name: string
    function_args: string[]
  }
  updatedTrigger: PGTriggerCreate & Pick<PGTrigger, 'enabled_mode'>
}) {
  const { name, activation, events, schema, table, function_schema, function_name, function_args } =
    updatedTrigger
  return /* SQL */ `
BEGIN;
DROP TRIGGER "${originalTrigger.name}" ON "${originalTrigger.schema}"."${originalTrigger.table}";
CREATE TRIGGER "${name}" ${activation} ${events.join(' OR ')} ON "${schema}"."${table}" 
  FOR EACH ROW EXECUTE FUNCTION 
  "${function_schema}"."${function_name}"(${function_args?.map(literal).join(',') ?? ''});
COMMIT;
`.trim()
}
