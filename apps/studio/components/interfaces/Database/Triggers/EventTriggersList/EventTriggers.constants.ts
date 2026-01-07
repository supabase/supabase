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

export const EVENT_TRIGGER_TEMPLATES = [
  {
    name: 'Auto enable RLS',
    description: 'Enable RLS automatically on new tables in selected schemas.',
    content: DEFAULT_EVENT_TRIGGER_SQL,
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
