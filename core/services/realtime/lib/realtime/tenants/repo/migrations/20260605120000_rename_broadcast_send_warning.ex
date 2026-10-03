defmodule Realtime.Tenants.Migrations.RenameBroadcastSendWarning do
  @moduledoc false
  use Ecto.Migration

  def change do
    execute("""
    CREATE OR REPLACE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true ) RETURNS void
    AS $$
    DECLARE
      generated_id uuid;
      final_payload jsonb;
    BEGIN
      BEGIN
        generated_id := gen_random_uuid();

        -- Check if payload has an 'id' key, if not, add the generated UUID
        IF payload ? 'id' THEN
          final_payload := payload;
        ELSE
          final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
        END IF;

        -- Set the topic configuration
        EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

        INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
        VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
      END;
    END;
    $$
    LANGUAGE plpgsql;
    """)

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
          RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
      END;
    END;
    $$ LANGUAGE plpgsql;
    """)
  end
end
