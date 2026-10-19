CREATE OR REPLACE FUNCTION public.update_last_changed_checksum (
  new_parent_page text,
  new_heading     text,
  new_checksum    text,
  git_update_time timestamp with time zone,
  check_time      timestamp with time zone
)
  RETURNS timestamp WITH time zone
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
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
$function$;

GRANT EXECUTE ON FUNCTION "public"."update_last_changed_checksum"(text, text, text, timestamp WITH time zone, timestamp WITH time zone) TO "service_role";

REVOKE ALL ON FUNCTION "public"."update_last_changed_checksum"(text, text, text, timestamp WITH time zone, timestamp WITH time zone) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."update_last_changed_checksum"(text, text, text, timestamp WITH time zone, timestamp WITH time zone) TO "postgres";

REVOKE ALL ON FUNCTION "public"."update_last_changed_checksum"(text, text, text, timestamp WITH time zone, timestamp WITH time zone) FROM PUBLIC, "anon", "authenticated";
