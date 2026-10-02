defmodule Realtime.Tenants.Migrations.FixSendFunction do
  @moduledoc false
  use Ecto.Migration

  # We missed the schema prefix of `realtime.` in the create table partition statement
  def change do
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
          'CREATE TABLE realtime.%I PARTITION OF realtime.messages FOR VALUES FROM (%L) TO (%L)',
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
