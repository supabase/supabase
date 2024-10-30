create or replace function update_last_changed_checksum(
  new_parent_page text,
  new_heading text,
  new_checksum text,
  git_update_time timestamp with time zone,
  check_time timestamp with time zone  
)
returns timestamp with time zone
language plpgsql
as $$
declare
  existing_id bigint;
  previous_checksum text;
  updated_check_time timestamp with time zone;
begin
  select id, checksum into existing_id, previous_checksum
    from public.last_changed
    where
      parent_page = new_parent_page
      and heading = new_heading
  ;

  if existing_id is not null
    and previous_checksum is not null
    and previous_checksum = new_checksum

    then
      update public.last_changed set
        last_checked = check_time
        where
		  last_changed.id = existing_id
		  and last_changed.last_checked < check_time
		returning last_checked into updated_check_time
      ;

    else
      insert into public.last_changed (
        parent_page,
        heading,
        checksum,
        last_updated,
        last_checked
      ) values (
        new_parent_page,
        new_heading,
        new_checksum,
        git_update_time,
        check_time
      )
      on conflict
	    on constraint last_changed_parent_page_heading_key
        do update set
          checksum = new_checksum,
          last_updated = git_update_time,
          last_checked = check_time
        where
          last_changed.id = existing_id
		  and last_changed.last_checked < check_time
	  returning last_checked into updated_check_time
      ;

  end if;

  return updated_check_time;
end;
$$
;

revoke all on function public.update_last_changed_checksum
from public, anon, authenticated;

create or replace function cleanup_last_changed_pages()
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

  with deleted as (
    delete from public.last_changed
    where last_checked <> newest_check_time
    returning id
  )
  select count(*)
  from deleted
  into number_deleted;

  return number_deleted;
end;
$$
;

revoke all on function public.cleanup_last_changed_pages
from public, anon, authenticated;
