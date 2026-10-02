defmodule Realtime.Tenants.Migrations.AddSendBinaryFunction do
  @moduledoc false
  use Ecto.Migration

  def change do
    execute("DROP FUNCTION IF EXISTS realtime.send(bytea, text, text, boolean)")

    execute("""
    CREATE OR REPLACE FUNCTION realtime.send_binary(
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
