CREATE OR REPLACE FUNCTION content.delete_error_codes_except (
  skip_codes jsonb
)
  RETURNS integer
  LANGUAGE sql
  SET search_path TO ''
  AS $function$
    with updated as (
        update content.error
        set deleted_at = now()
        where
            deleted_at is null
            and not exists (
                select 1
                from jsonb_array_elements(skip_codes) skipped
                join content.service on service.name = (skipped ->> 'service')
                where service.id = error.service
                and error.code = (skipped ->> 'error_code')
            )
        returning *
    )
    select count(*) from updated;
$function$;
