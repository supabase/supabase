select
  e.evtname,
  e.evtowner::regrole as evtowner,
  n_func.nspname as evtfunction_schema,
  e.evtfoid::regproc as evtfunction,
  p.proowner::regrole as function_owner
from pg_event_trigger e
join pg_proc p
  on e.evtfoid = p.oid
join pg_namespace n_func
  on p.pronamespace = n_func.oid
where p.prorettype = 'event_trigger'::regtype;
