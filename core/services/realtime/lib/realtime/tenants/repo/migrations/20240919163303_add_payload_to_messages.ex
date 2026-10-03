defmodule Realtime.Tenants.Migrations.AddPayloadToMessages do
  @moduledoc false
  use Ecto.Migration

  def change do
    alter table(:messages) do
      add_if_not_exists :payload, :map
      add_if_not_exists :event, :text
      add_if_not_exists :topic, :text
      add_if_not_exists :private, :boolean, default: true

      modify :inserted_at, :utc_datetime, default: fragment("now()")
      modify :updated_at, :utc_datetime, default: fragment("now()")
    end

    execute """
    CREATE OR REPLACE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true)
    RETURNS void
    AS $$
    BEGIN
        INSERT INTO realtime.messages (payload, event, topic, private, extension)
        VALUES (payload, event, topic, private, 'broadcast');
    END;
    $$
    LANGUAGE plpgsql;
    """

    execute """
    CREATE OR REPLACE FUNCTION realtime.broadcast_changes (topic_name text, event_name text, operation text, table_name text, table_schema text, NEW record, OLD record, level text DEFAULT 'ROW')
        RETURNS void
        AS $$
    DECLARE
        -- Declare a variable to hold the JSONB representation of the row
        row_data jsonb := '{}'::jsonb;
    BEGIN
        IF level = 'STATEMENT' THEN
            RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
        END IF;
        -- Check the operation type and handle accordingly
        IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
            row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
            PERFORM realtime.send (row_data, event_name, topic_name);
        ELSE
            RAISE EXCEPTION 'Unexpected operation type: %', operation;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
    END;

    $$
    LANGUAGE plpgsql;
    """
  end
end
