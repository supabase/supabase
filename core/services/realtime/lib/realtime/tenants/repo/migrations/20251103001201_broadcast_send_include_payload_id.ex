defmodule Realtime.Tenants.Migrations.BroadcastSendIncludePayloadId do
  @moduledoc false
  use Ecto.Migration

  # Include ID in the payload if not defined
  def change do
    execute("""
    CREATE OR REPLACE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true ) RETURNS void
    AS $$
    DECLARE
      generated_id uuid;
      final_payload jsonb;
    BEGIN
      BEGIN
        -- Generate a new UUID for the id
        generated_id := gen_random_uuid();

        -- Check if payload has an 'id' key, if not, add the generated UUID
        IF payload ? 'id' THEN
          final_payload := payload;
        ELSE
          final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
        END IF;

        -- Set the topic configuration
        EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

        -- Attempt to insert the message
        INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
        VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
      EXCEPTION
        WHEN OTHERS THEN
          -- Capture and notify the error
          RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
      END;
    END;
    $$
    LANGUAGE plpgsql;
    """)
  end
end
