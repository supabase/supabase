defmodule Realtime.Tenants.Migrations.RealtimeSendSetsConfig do
  @moduledoc false
  use Ecto.Migration

  # We missed the schema prefix of `realtime.` in the create table partition statement
  def change do
    execute("""
    CREATE OR REPLACE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true ) RETURNS void
    AS $$
    BEGIN
      BEGIN
        -- Set the topic configuration
        SET LOCAL realtime.topic TO topic;

        -- Attempt to insert the message
        INSERT INTO realtime.messages (payload, event, topic, private, extension)
        VALUES (payload, event, topic, private, 'broadcast');
      EXCEPTION
        WHEN OTHERS THEN
          -- Capture and notify the error
          PERFORM pg_notify(
              'realtime:system',
              jsonb_build_object(
                  'error', SQLERRM,
                  'function', 'realtime.send',
                  'event', event,
                  'topic', topic,
                  'private', private
              )::text
          );
      END;
    END;
    $$
    LANGUAGE plpgsql;
    """)
  end
end
