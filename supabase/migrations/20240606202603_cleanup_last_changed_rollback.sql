create or replace function cleanup_last_changed_pages_v2(
  workflow_used_time timestamp with time zone
)
returns integer
language plpgsql
as $$
declare
  newest_check_time timestamp with time zone;
  number_deleted integer;
begin
  select last_checked into newest_check_time
    from public.last_changed
    order by last_checked desc
    limit 1
  ;

  if newest_check_time = workflow_used_time

    then
      -- This workflow is the most recent one, keep its changes
      with deleted as (
        delete from public.last_changed
        where last_checked <> newest_check_time
        returning id
      )
      select count(*)
      from deleted
      into number_deleted;

    else
	  -- Other workflows with more recent timestamps ran/are running
	  -- concurrently
	  -- Do nothing
	  select 0 into number_deleted;

  end if;

  return number_deleted;
end;
$$
;

revoke all on function public.cleanup_last_changed_pages_v2
from public, anon, authenticated;
