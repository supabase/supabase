alter table troubleshooting_entries
add column github_id text not null;

alter table troubleshooting_entries
add column checksum text not null;

create index idx_troubleshooting_checksum
on troubleshooting_entries (checksum);

create extension pg_jsonschema;

alter table troubleshooting_entries
add constraint troubleshooting_api_check
check (
    api is null or
    jsonb_matches_schema(
        schema := '{
            "type": "object",
            "properties": {
                "sdk": {
                    "type": "array",
                    "items": { "type": "string" }
                },
                "management_api": {
                    "type": "array",
                    "items": { "type": "string" }
                },
                "cli": {
                    "type": "array",
                    "items": { "type": "string" }
                }
            },
            "additionalProperties": false
        }',
        instance := api
    )
);

create or replace function validate_troubleshooting_errors(errors jsonb[])
returns boolean as $$
declare
    error jsonb;
begin
    if errors is null then
        return true;
    end if;

    foreach error in array errors
    loop
        if not jsonb_matches_schema(
            schema := '{
                "type": "object",
                "properties": {
                    "http_status_code": { "type": "number" },
                    "code": { "type": "string" },
                    "message": { "type": "string" }
                },
                "additionalProperties": false
            }',
            instance := error
        ) then
            return false;
        end if;
    end loop;

    return true;
end;
$$ language plpgsql;

alter table troubleshooting_entries
add constraint troubleshooting_errors_check
check (
    validate_troubleshooting_errors(errors)
);
