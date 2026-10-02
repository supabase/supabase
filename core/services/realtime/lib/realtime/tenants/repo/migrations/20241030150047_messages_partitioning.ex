defmodule Realtime.Tenants.Migrations.MessagesPartitioning do
  @moduledoc false
  use Ecto.Migration

  def change do
    execute("""
        CREATE TABLE IF NOT EXISTS realtime.messages_new (
          id BIGSERIAL,
          uuid TEXT DEFAULT gen_random_uuid(),
          topic TEXT NOT NULL,
          extension TEXT NOT NULL,
          payload JSONB,
          event TEXT,
          private BOOLEAN DEFAULT FALSE,
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          inserted_at TIMESTAMP NOT NULL DEFAULT NOW(),
          PRIMARY KEY (id, inserted_at)
        ) PARTITION BY RANGE (inserted_at)
    """)

    execute("ALTER TABLE realtime.messages_new ENABLE ROW LEVEL SECURITY")

    execute("""
    DO $$
    DECLARE
      rec record;
      sql text;
      role_list text;
    BEGIN
      FOR rec IN
        SELECT *
        FROM pg_policies
        WHERE schemaname = 'realtime'
        AND tablename = 'messages'
      LOOP
        -- Start constructing the create policy statement
        sql := 'CREATE POLICY ' || quote_ident(rec.policyname) ||
             ' ON realtime.messages_new ';

        IF (rec.permissive = 'PERMISSIVE') THEN
          sql := sql || 'AS PERMISSIVE ';
        ELSE
          sql := sql || 'AS RESTRICTIVE ';
        END IF;

        sql := sql || ' FOR ' || rec.cmd;

        -- Include roles if specified
        IF rec.roles IS NOT NULL AND array_length(rec.roles, 1) > 0 THEN
          role_list := (
            SELECT string_agg(quote_ident(role), ', ')
            FROM unnest(rec.roles) AS role
          );
          sql := sql || ' TO ' || role_list;
        END IF;

        -- Include using clause if specified
        IF rec.qual IS NOT NULL THEN
          sql := sql || ' USING (' || rec.qual || ')';
        END IF;

        -- Include with check clause if specified
        IF rec.with_check IS NOT NULL THEN
          sql := sql || ' WITH CHECK (' || rec.with_check || ')';
        END IF;

        -- Output the constructed sql for debugging purposes
        RAISE NOTICE 'Executing: %', sql;

        -- Execute the constructed sql statement
        EXECUTE sql;
      END LOOP;
    END
    $$
    """)

    execute("ALTER TABLE realtime.messages RENAME TO messages_old")
    execute("ALTER TABLE realtime.messages_new RENAME TO messages")
    execute("DROP TABLE realtime.messages_old")

    execute("CREATE SEQUENCE IF NOT EXISTS realtime.messages_id_seq")

    execute("ALTER TABLE realtime.messages ALTER COLUMN id SET DEFAULT nextval('realtime.messages_id_seq')")

    execute("ALTER table realtime.messages OWNER to supabase_realtime_admin")

    execute("GRANT USAGE ON SEQUENCE realtime.messages_id_seq TO postgres, anon, authenticated, service_role")

    execute("GRANT SELECT ON realtime.messages TO postgres, anon, authenticated, service_role")
    execute("GRANT UPDATE ON realtime.messages TO postgres, anon, authenticated, service_role")
    execute("GRANT INSERT ON realtime.messages TO postgres, anon, authenticated, service_role")

    execute("ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY")

    execute("""
    CREATE OR REPLACE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true)
    RETURNS void
    AS $$
    DECLARE
      partition_name text;
    BEGIN
      partition_name := 'messages_' || to_char(NOW(), 'YYYY_MM_DD');

      IF NOT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'realtime'
        AND c.relname = partition_name
      ) THEN
        EXECUTE format(
          'CREATE TABLE %I PARTITION OF realtime.messages FOR VALUES FROM (%L) TO (%L)',
          partition_name,
          NOW(),
          (NOW() + interval '1 day')::timestamp
        );
      END IF;

      INSERT INTO realtime.messages (payload, event, topic, private, extension)
      VALUES (payload, event, topic, private, 'broadcast');
    END;
    $$
    LANGUAGE plpgsql;
    """)
  end
end
