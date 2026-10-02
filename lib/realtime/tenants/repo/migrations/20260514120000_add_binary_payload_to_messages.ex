defmodule Realtime.Tenants.Migrations.AddBinaryPayloadToMessages do
  @moduledoc false
  use Ecto.Migration

  def change do
    execute("ALTER TABLE realtime.messages ADD COLUMN IF NOT EXISTS binary_payload bytea")

    execute("""
    ALTER TABLE realtime.messages
      ADD CONSTRAINT messages_payload_exclusive
      CHECK (payload IS NULL OR binary_payload IS NULL) NOT VALID
    """)

    execute("""
    CREATE OR REPLACE FUNCTION realtime.send(
      payload bytea,
      event text,
      topic text,
      private boolean DEFAULT true
    ) RETURNS void AS $$
    DECLARE
      generated_id uuid;
    BEGIN
      BEGIN
        generated_id := gen_random_uuid();

        EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

        INSERT INTO realtime.messages (id, binary_payload, event, topic, private, extension)
        VALUES (generated_id, payload, event, topic, private, 'broadcast');
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
      END;
    END;
    $$ LANGUAGE plpgsql;
    """)
  end
end
