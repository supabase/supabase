defmodule Realtime.Tenants.Migrations.BroadcastSendErrorLogging do
  @moduledoc false
  use Ecto.Migration
  # Removes pg_notification to use postgres logging instead
  def change do
    execute("""
    CREATE OR REPLACE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true ) RETURNS void
    AS $$
    BEGIN
      BEGIN
        -- Set the topic configuration
        EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

        -- Attempt to insert the message
        INSERT INTO realtime.messages (payload, event, topic, private, extension)
        VALUES (payload, event, topic, private, 'broadcast');
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
