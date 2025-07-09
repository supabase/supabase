create or replace function content.delete_error_codes_except(
    skip_codes jsonb
)
returns void
set search_path = ''
language sql
as $$
    delete from content.error
    where not exists (
        select 1
        from jsonb_array_elements(skip_codes) skipped
        join content.service on service.name = (skipped ->> 'service')
        where service.id = error.service
        and error.code = (skipped ->> 'error_code')
    );
$$;
