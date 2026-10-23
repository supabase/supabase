alter default privileges in schema content
revoke execute on functions from anon;

alter default privileges in schema content
revoke execute on functions from authenticated;

create function content.update_error_code(
    code text,
    service text,
    http_status_code smallint default null,
    message text default null
)
returns boolean
set search_path = ''
language plpgsql
as $$
#variable_conflict use_variable
declare
    service_id uuid;
    result boolean;
begin
    insert into content.service (name)
    values (service)
    on conflict (name) do nothing;

    select id into service_id
    from content.service
    where name = service;

    insert into content.error (service, code, http_status_code, message)
    values (service_id, code, http_status_code, message)
    on conflict on constraint error_pkey do
        update set
            http_status_code = excluded.http_status_code,
            message = excluded.message
        where
            error.service = service_id
            and error.code = code
            and (
                error.http_status_code is distinct from excluded.http_status_code
                or error.message is distinct from excluded.message
            )
        returning true into result;

    return coalesce(result, false);
end;
$$;
