drop function content.delete_error_codes_except(jsonb);

-- Recreating function to return the number of rows deleted
create or replace function content.delete_error_codes_except(
    skip_codes jsonb
)
returns integer
set search_path = ''
language sql
as $$
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
$$;
