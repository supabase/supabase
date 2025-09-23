alter table content.error
add column metadata jsonb;

alter table content.error
add constraint constraint_content_error_metadata_schema check (
    jsonb_matches_schema(
        '{
            "type": "object",
            "properties": {
                "references": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "href": {
                                "type": "string"
                            },
                            "description": {
                                "type": "string"
                            }
                        },
                        "required": ["href", "description"]
                    }
                }
            }
        }',
        metadata
    )
);

drop function content.update_error_code;

-- Recreate function also taking a metadata field
-- See comments for what is new
create function content.update_error_code(
    code text,
    service text,
    http_status_code smallint default null,
    message text default null,
    -- Only new parameter
    metadata jsonb default null
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
$$;
