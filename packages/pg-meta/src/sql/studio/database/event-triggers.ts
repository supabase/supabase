import { safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getEventTriggersSql = (): SafeSqlFragment => safeSql`
select
  evt.oid,
  evt.evtname as name,
  evt.evtevent as event,
  case evt.evtenabled
    when 'O' then 'ORIGIN'
    when 'A' then 'ALWAYS'
    when 'R' then 'REPLICA'
    when 'D' then 'DISABLED'
  end as enabled_mode,
  evt.evttags as tags,
  proc.proname as function_name,
  namespace.nspname as function_schema,
  owner.rolname as owner,
  case
    when proc.oid is not null then pg_get_functiondef(proc.oid)
    else null
  end as function_definition
from pg_event_trigger as evt
left join pg_proc as proc on proc.oid = evt.evtfoid
left join pg_namespace as namespace on namespace.oid = proc.pronamespace
left join pg_roles as owner on owner.oid = evt.evtowner
order by evt.evtname;
`
