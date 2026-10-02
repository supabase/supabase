defmodule Realtime.Tenants.Migrations.RedefineAuthorizationTables do
  @moduledoc false

  use Ecto.Migration

  def change do
    drop_if_exists table(:broadcasts), mode: :cascade
    drop_if_exists table(:presences), mode: :cascade
    drop_if_exists table(:channels), mode: :cascade

    create_if_not_exists table(:messages) do
      add :topic, :text, null: false
      add :extension, :text, null: false
      timestamps()
    end

    create_if_not_exists index(:messages, [:topic])

    execute("ALTER TABLE realtime.messages ENABLE row level security")
    execute("GRANT SELECT ON realtime.messages TO postgres, anon, authenticated, service_role")
    execute("GRANT UPDATE ON realtime.messages TO postgres, anon, authenticated, service_role")

    execute("""
    GRANT INSERT ON realtime.messages TO postgres, anon, authenticated, service_role
    """)

    execute("""
    GRANT USAGE ON SEQUENCE realtime.messages_id_seq TO postgres, anon, authenticated, service_role
    """)

    execute("ALTER table realtime.messages OWNER to supabase_realtime_admin")

    execute("""
    DROP function IF EXISTS realtime.channel_name
    """)

    execute("""
    create or replace function realtime.topic() returns text as $$
    select nullif(current_setting('realtime.topic', true), '')::text;
    $$ language sql stable;
    """)

    execute("ALTER function realtime.topic() owner to supabase_realtime_admin")
  end
end
