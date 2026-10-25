CREATE OR REPLACE FUNCTION content.update_error_code (
  code             text,
  service          text,
  http_status_code smallint DEFAULT NULL::smallint,
  message          text     DEFAULT NULL::text,
  metadata         jsonb    DEFAULT NULL::jsonb
)
  RETURNS boolean
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
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

    insert into content.error (
        service,
        code,
        http_status_code,
        message,
        -- Added metadata here
        metadata
    )
    -- Added metadata here
    values (service_id, code, http_status_code, message, metadata)
    on conflict on constraint error_pkey do
        update set
            http_status_code = excluded.http_status_code,
            message = excluded.message,
            -- Added metadata here
            metadata = excluded.metadata
        where
            error.service = service_id
            and error.code = code
            and (
                error.http_status_code is distinct from excluded.http_status_code
                or error.message is distinct from excluded.message
                -- Added metadata here
                or error.metadata is distinct from excluded.metadata
            )
        returning true into result;

    return coalesce(result, false);
end;
$function$;
