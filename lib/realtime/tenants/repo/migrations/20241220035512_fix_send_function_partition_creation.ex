defmodule Realtime.Tenants.Migrations.FixSendFunctionPartitionCreation do
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
    partition_start timestamp;
    partition_end timestamp;
    BEGIN
      partition_start := date_trunc('day', NOW());
      partition_end := partition_start + interval '1 day';
      partition_name := 'messages_' || to_char(partition_start, 'YYYY_MM_DD');

      BEGIN
        EXECUTE format(
          'CREATE TABLE IF NOT EXISTS realtime.%I PARTITION OF realtime.messages FOR VALUES FROM (%L) TO (%L)',
          partition_name,
          partition_start,
          partition_end
        );
        EXCEPTION WHEN duplicate_table THEN
        -- Ignore; table already exists
      END;

      INSERT INTO realtime.messages (payload, event, topic, private, extension)
      VALUES (payload, event, topic, private, 'broadcast');
    END;
    $$
    LANGUAGE plpgsql;
    """)
  end
end
