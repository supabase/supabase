CREATE TABLE
  public."API_AUTH" (
    id uuid not null default gen_random_uuid (),
    api_operation_name text not null,
    schema_name text not null,
    table_name text not null,
    users jsonb null,
    groups jsonb null,
    module_tag jsonb null,
    meta_info jsonb null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone null,
    constraint API_AUTH_pkey primary key (api_operation_name, schema_name, table_name)
  ) tablespace pg_default;

CREATE OR REPLACE FUNCTION insert_api_auth_records()
RETURNS EVENT_TRIGGER
SECURITY DEFINER
AS $$
DECLARE
    command RECORD;
BEGIN
    RAISE NOTICE 'Inserting records for table appu';
    FOR command IN
        SELECT * FROM pg_event_trigger_ddl_commands()
        WHERE command_tag = 'CREATE TABLE'
    LOOP
        -- Extract schema and table names
        IF command.schema_name = 'public' THEN
            RAISE NOTICE 'Inserting records for table: % %', command.objid::regclass::text, command.object_identity;
            INSERT INTO public."API_AUTH" (api_operation_name, schema_name, table_name)
            VALUES 
                ('GET', command.schema_name, command.object_identity),
                ('POST', command.schema_name, command.object_identity),
                ('PATCH', command.schema_name, command.object_identity),
                ('PUT', command.schema_name, command.object_identity),
                ('DELETE', command.schema_name, command.object_identity);
        ELSE
            RAISE NOTICE 'Skipping non-public table: %', command;
        END IF;
    END LOOP;
    RAISE NOTICE 'Completed inserting API auth records';
    RETURN;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_api_auth_records()
RETURNS EVENT_TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    command RECORD;
BEGIN
    FOR command IN
        SELECT * FROM pg_event_trigger_dropped_objects()
        WHERE object_type = 'table'
    LOOP
        -- Extract schema and table names
	    RAISE NOTICE 'Deleting records for table: % % % % % %', command.objid::regclass::text, command.schema_name, command.classid::regclass::text, command.object_type, command.object_name, command.object_identity;
        IF command.schema_name = 'public' THEN
            RAISE NOTICE 'Deleting records for table: %', command.objid::regclass::text;
            DELETE FROM public."API_AUTH"
            WHERE schema_name = command.schema_name
              AND table_name = command.object_identity;
        ELSE
           RAISE NOTICE 'Skipping non-public table: %', command.objid::regclass::text;
        END IF;
    END LOOP;
    RAISE NOTICE 'Completed deleting API auth records';
    RETURN;
END;
$$;

CREATE EVENT TRIGGER insert_api_auth_trigger
ON ddl_command_end
WHEN TAG IN ('CREATE TABLE')
EXECUTE FUNCTION insert_api_auth_records();

CREATE EVENT TRIGGER delete_api_auth_trigger
ON ddl_command_end
WHEN TAG IN ('DROP TABLE')
EXECUTE FUNCTION delete_api_auth_records();

