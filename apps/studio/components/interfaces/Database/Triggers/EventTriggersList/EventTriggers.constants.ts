export const DEFAULT_EVENT_TRIGGER_SQL = `CREATE OR REPLACE FUNCTION event_trigger_fn()
RETURNS event_trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Add logic here
END;
$$;

DROP EVENT TRIGGER IF EXISTS event_trigger_name;
CREATE EVENT TRIGGER event_trigger_name
ON ddl_command_end
EXECUTE FUNCTION event_trigger_fn();
`

export const AUTO_ENABLE_RLS_EVENT_TRIGGER_SQL = `
CREATE OR REPLACE FUNCTION rls_auto_enable()
RETURNS EVENT_TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;

DROP EVENT TRIGGER IF EXISTS ensure_rls;
CREATE EVENT TRIGGER ensure_rls
ON ddl_command_end
WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
EXECUTE FUNCTION rls_auto_enable();`

export const EVENT_TRIGGER_TEMPLATES = [
  {
    name: 'Auto enable RLS',
    description: 'Enable RLS automatically on new tables in selected schemas.',
    content: AUTO_ENABLE_RLS_EVENT_TRIGGER_SQL,
  },
  {
    name: 'Prevent table drops',
    description: 'Block dropping tables using the sql_drop event trigger.',
    content: `-- Function
CREATE OR REPLACE FUNCTION dont_drop_function()
  RETURNS event_trigger LANGUAGE plpgsql AS $$
DECLARE
    obj record;
    tbl_name text;
BEGIN
    FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
    LOOP
        IF obj.object_type = 'table' THEN
            RAISE EXCEPTION 'ERROR: All tables in this schema are protected and cannot be dropped';
        END IF;
    END LOOP;
END;
$$;
-- Event trigger
CREATE EVENT TRIGGER dont_drop_trigger
ON sql_drop
EXECUTE FUNCTION dont_drop_function();
`,
  },
  {
    name: 'Blank event trigger',
    description: 'A minimal scaffold to start from.',
    content: DEFAULT_EVENT_TRIGGER_SQL,
  },
]
